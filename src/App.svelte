<script lang="ts">
  import Mesh from './components/Mesh.svelte';
  import Setup from './components/Setup.svelte';
  import Splash from './components/Splash.svelte';
  import CardView from './components/Card.svelte';
  import Browse from './components/Browse.svelte';
  import CustomDeck from './components/CustomDeck.svelte';
  import PrivateCard from './components/PrivateCard.svelte';
  import Celebration from './components/Celebration.svelte';
  import Icon from './components/Icon.svelte';
  import { draw, drawWarmLanding, load, save, loadNight, saveNight, clearNight, trackLove, unlockAudio, seedSeen, loadCustom, type Mode, MODES, ALL_DECKS } from './lib/game.svelte';
import { swell, isMuted, setMuted, loadMuted } from './lib/audio.svelte';
  import type { Card, DeckId } from './lib/schema';

  const persisted = $state(load());
  loadMuted(); // sound preference before any sound fires
  let names = $state(persisted.names);
  let mode = $state<Mode>('mixup');
  let decks = $state<DeckId[]>([...ALL_DECKS.filter((d) => d !== 'inferno')]);
  let safeword = $state('');
  let screen = $state<'setup' | 'splash' | 'play' | 'celebrate' | 'browse' | 'handoff' | 'private' | 'custom'>('setup');
  /** pass-the-phone: when true, every draw deals the holder a PRIVATE card (PrivateCard flow) */
  let ptp = $state(false);
  /** the private card currently held (already drawn + marked seen) */
  let privateCard = $state<Card | null>(null);
  let card = $state<Card | null>(null);
  let soft = $state(false);
  let skips = $state(6);
  let count = $state(0);
  let landing = $state(false);
  let commanding = $state<'a' | 'b' | null>(null); // whose command the current card is
  let releaseUsed = $state<{ holder: 'a' | 'b'; state: 'spent' | 'gifted' } | null>(null); // celebration line
  let relOpen = $state(false); // release popover
  let resumeAvailable = $state(loadNight());
  let wakeLock: { release: () => Promise<void> } | null = null;

  const night = $state(loadNight() ?? {
    mode: 'mixup' as Mode, decks: [...decks], cardId: null, count: 0, skips: 6,
    seen: [] as string[], loveCounts: {}, drawIndex: 0, lastBombIndex: -99, safeword: '', landing: false,
    tokens: { a: 3, b: 3 }, turn: 'a' as 'a' | 'b',
  });

  function persistNight() {
    night.decks = [...decks];
    night.mode = mode;
    // in pass-the-phone the dealt card lives in privateCard (public `card` stays null);
    // while a handoff is pending BOTH are null — keep the last persisted cardId so the
    // night never looks dead mid-handoff (resume lands on the handoff screen)
    const nextCardId = card?.id ?? privateCard?.id ?? null;
    if (nextCardId !== null || !ptp) night.cardId = nextCardId;
    night.ptp = ptp;
    night.count = count;
    night.skips = skips;
    night.safeword = safeword;
    night.landing = landing;
    night.tokens = night.tokens ?? { a: 3, b: 3 };
    night.turn = night.turn ?? 'a';
    saveNight(night);
  }
  async function lockScreen() {
    try { wakeLock = (await navigator.wakeLock.request('screen')) as typeof wakeLock; } catch { /* best effort */ }
  }
  async function unlockScreen() {
    try { await wakeLock?.release(); } catch { /* fine */ }
    wakeLock = null;
  }
  async function goFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* best effort */ }
  }

  function advance(except?: Card) {
    (window as unknown as { __dbg?: unknown }).__dbg = { customLen: (persisted.custom ?? []).length, decks: [...decks], mode };
    const c = draw(mode, decks, persisted.retired, night, except, persisted.custom ?? []);
    if (!c) { end(); return; }
    card = c;
    soft = false;
    count += 1;
    night.drawIndex += 1;
    night.seen = [...night.seen, c.id];
    trackLove(night, c);
    landing = false;
    commanding = null; // a command card is consumed by the very next advance
    // turn alternates every normal draw so token spending stays fair
    night.turn = night.turn === 'a' ? 'b' : 'a';
    screen = 'play';
    persistNight();
    return c;
  }

  function next() { advance(card ?? undefined); }

  function skip() {
    if (skips <= 0) return;
    skips -= 1;
    advance(card ?? undefined);
  }

  function spendToken() {
    // spend the CURRENT player's token: their next card is a command they issue —
    // the draw engine serves it, and the card plays with 'command' framing (no skip)
    const who = night.turn;
    if ((night.tokens?.[who] ?? 0) <= 0) return;
    night.tokens = { ...night.tokens, [who]: night.tokens[who] - 1 };
    next();
    commanding = who; // AFTER advance — advance clears it; this card is now the command
    persistNight();
  }

  // ---- release token: one per night, spend or gift (transfer is implicit in gifting) ----
  function spendRelease() {
    if (!night.release || night.release.state !== 'held') return;
    night.release = { holder: night.release.holder, state: 'spent' };
    persistNight();
    releaseUsed = night.release;
  }
  function giftRelease() {
    if (!night.release || night.release.state !== 'held') return;
    const to = night.release.holder === 'a' ? 'b' : 'a';
    night.release = { holder: to, state: 'held' }; // gifted = the OTHER player now holds it
    persistNight();
  }

  function retire() {
    if (!card) return;
    persisted.retired = [...persisted.retired, card.id];
    save(persisted);
    advance(card);
  }

  function begin(silent = false) {
    unlockAudio();
    lockScreen();
    // fresh night: reset in-memory engine state (seen cards, love balance, tokens)
    night.seen = [];
    night.loveCounts = {};
    night.drawIndex = 0;
    night.lastBombIndex = -99;
    night.tokens = { a: 3, b: 3 };
    night.turn = 'a';
    // release starts with player b: the first advance flips turn to 'b' after dealing to
    // the a-player... actually the deal lands on whoever's turn it WAS; release should start
    // with the player who holds the FIRST card = 'a' (turn before the flip). After advance()
    // turn becomes 'b' (next dealer) while release.holder stays 'a' — matching the card in play.
    night.release = { holder: 'b', state: 'held' }; // starts with the NEXT dealer; gift/keep shows on their turn
    ptp = false;
    privateCard = null;
    seedSeen([]);
    // test/journey hook: ember.focusCustom=1 seeds seen[] with every base card so only
    // custom cards draw (deterministic custom-deck verification; harmless in normal play)
    try {
      if (localStorage.getItem('ember.focusCustom') === '1') {
        const baseIds = ALL_DECKS.flatMap((d) => DECKS_MAP[d]?.cards.map((c) => c.id) ?? []);
        night.seen = baseIds;
        seedSeen(baseIds);
      }
    } catch { /* no-op */ }
    if (!silent) next(); // silent = the caller deals the first card themselves (pass-the-phone)
  }

  // ---- pass-the-phone flow ----
  function startPtp() {
    ptp = true;
    nextPrivate(); // first private card goes to the turn holder (a) directly — no public draw first
  }

  function nextPrivate() {
    const c = draw(mode, decks, persisted.retired, night, undefined);
    if (!c) { end(); return; }
    privateCard = c;
    count += 1;
    night.drawIndex += 1;
    night.seen = [...night.seen, c.id];
    trackLove(night, c);
    night.cardId = c.id;
    persistNight();
    screen = 'private';
  }

  function privateDone() {
    // the private card has been read; the phone passes; the other player gets theirs
    privateCard = null;
    night.turn = night.turn === 'a' ? 'b' : 'a';
    // keep cardId pointing at the last dealt card so an interruption here resumes into the handoff
    persistNight();
    screen = 'handoff';
  }

  function handoffDone() {
    if (!ptp) { screen = 'setup'; return; }
    nextPrivate();
  }

  function endPtp() {
    // leaving pass-the-phone: back to normal play (tokens/skips/skips carry over)
    ptp = false;
    privateCard = null;
    end();
  }

  function resume() {
    const n = loadNight();
    if (!n) return;
    unlockAudio();
    lockScreen();
    mode = n.mode;
    decks = n.decks?.length ? n.decks : decks;
    safeword = n.safeword || '';
    skips = n.skips;
    count = n.count;
    landing = n.landing || false;
    night.tokens = n.tokens ?? { a: 3, b: 3 };
    night.turn = n.turn ?? 'a';
    night.release = n.release ?? { holder: 'a', state: 'held' };
    commanding = null;
    // pass-the-phone resume: NEVER render the stored card publicly (privacy).
    // Mid-handoff (ptp=true): go to the handoff screen. Mid-private-card: re-deal a fresh
    // private card for the turn holder (the old one stays seen — no reuse, no leak).
    if (n.ptp) {
      ptp = true;
      privateCard = null;
      night.seen = n.seen || [];
      night.loveCounts = n.loveCounts || {};
      night.drawIndex = n.drawIndex || 0;
      night.lastBombIndex = n.lastBombIndex ?? -99;
      seedSeen(night.seen);
      count = n.count;
      screen = 'handoff';
      persistNight();
      return;
    }
    const deckId = n.cardId?.split('-')[0] as DeckId;
    card = lookupCard(n.cardId ?? '');
    if (card) {
      night.seen = n.seen || [];
      night.loveCounts = n.loveCounts || {};
      night.drawIndex = n.drawIndex || 0;
      night.lastBombIndex = n.lastBombIndex ?? -99;
      seedSeen(card.id ? [...night.seen, card.id] : night.seen);
      screen = 'play';
    } else {
      next();
    }
  }

  function lookupCard(id: string): Card | null {
    // resolved through the decks module to keep one source of truth
    return (lookupCardFn as unknown as (id: string) => Card | null)(id);
  }
  import { DECKS as DECKS_MAP } from './lib/game.svelte';
  const lookupCardFn = (id: string): Card | null => {
    const deckId = id.split('-')[0] as DeckId;
    return DECKS_MAP[deckId]?.cards.find((c) => c.id === id) ?? null;
  };

  function end() {
    if (!landing) {
      // warm landing: one final gentle card before the celebration (peak-end rule, enforced)
      const w = drawWarmLanding(decks, persisted.retired);
      if (w) {
        card = w;
        soft = false;
        landing = true;
        screen = 'play';
        persistNight();
        return;
      }
    }
    landing = false;
    // capture tokens BEFORE clearing the night — the finale reads them
    const finalTokens = { ...(night.tokens ?? { a: 0, b: 0 }) };
    // capture love balance for the insights panel (draw-time data, otherwise lost)
    const finalLoves = { ...(night.loveCounts ?? {}) };
    save({
      names,
      nights: [...persisted.nights, { date: new Date().toISOString().slice(0, 10), cards: count, mode, loves: finalLoves, tokensSpent: { a: 3 - (finalTokens.a ?? 0), b: 3 - (finalTokens.b ?? 0) } } as never],
      retired: persisted.retired,
    });
    persisted.nights = load().nights;
    clearNight();
    unlockScreen();
    night.tokens = finalTokens; // kept in memory for the celebration's unspent-tokens finale
    swell(); // the night's last sound: warm major bloom under the celebration
    screen = 'celebrate';
  }

  function home() {
    unlockScreen();
    screen = 'setup';
    card = null;
    count = 0;
    skips = 6;
    landing = false;
    resumeAvailable = loadNight();
  }

  function setMode(m: Mode) {
    mode = m;
    decks = m === 'inferno' ? ['inferno'] : [...ALL_DECKS.filter((d) => (m === 'chill' ? d === 'spark' || d === 'closer' : m === 'heat' ? d !== 'spark' && d !== 'closer' && d !== 'inferno' : d !== 'inferno'))];
  }

  function toggleDeck(id: DeckId) {
    decks = decks.includes(id) ? decks.filter((d) => d !== id) : [...decks, id];
    if (decks.length === 0) decks = [...ALL_DECKS.filter((d) => d !== 'inferno')];
  }
</script>

<Mesh />

{#if screen === 'setup'}
  <Setup
    bind:names
    bind:mode
    bind:decks
    bind:safeword
    {setMode}
    {toggleDeck}
    resumeLabel={resumeAvailable ? `Resume your night — ${resumeAvailable.count} cards in` : ''}
    onResume={resume}
    onRestart={() => { clearNight(); resumeAvailable = null; count = 0; skips = 6; }}
    onStart={() => { clearNight(); (screen = 'splash'); }}
    onBrowse={() => { screen = 'browse'; }}
    onCustom={() => { screen = 'custom'; }}
    onPtp={() => { clearNight(); unlockAudio(); lockScreen(); begin(true); startPtp(); }}
  />
{:else if screen === 'browse'}
  <Browse
    retired={persisted.retired}
    onRetire={(id) => { persisted.retired = [...persisted.retired, id]; save(persisted); }}
    onUnretire={(id) => { persisted.retired = persisted.retired.filter((r) => r !== id); save(persisted); }}
    onClose={() => { screen = 'setup'; }}
  />
{:else if screen === 'custom'}
  <CustomDeck names={names} onClose={() => { persisted.custom = loadCustom(); screen = 'setup'; }} />
{:else if screen === 'handoff'}
  <div class="pcwrap handoff" data-testid="handoff">
    <div class="handoff-card glass">
      <div class="crown-sm"><Icon name="heart" size={26} /></div>
      <h2 class="display">Pass the phone.</h2>
      <p class="dim">{(night.turn === 'a' ? names.a : names.b) || 'The other player'}'s private card is waiting. Whatever was on yours is nobody's business but yours.</p>
      <button class="btn primary" onclick={handoffDone} data-testid="handoff-continue">I'm {((night.turn === 'a' ? names.a : names.b) || 'next')} — show mine</button>
      <div class="handoff-row">
        <button class="btn ghost" onclick={() => { ptp = false; privateCard = null; next(); }} data-testid="ptp-exit">Leave private mode</button>
        <button class="btn ghost" onclick={endPtp} data-testid="ptp-end">End the night</button>
      </div>
    </div>
  </div>
{:else if screen === 'private' && privateCard}
  <PrivateCard
    card={privateCard}
    holder={night.turn}
    {names}
    onDone={privateDone}
  />
{:else if screen === 'splash'}
  <Splash onBegin={() => begin()} />
{:else if screen === 'play' && card}
  <main class="stage" data-testid="stage">
    <div class="topbar">
      <span class="modetag">{landing ? 'the landing' : MODES.find((m) => m.id === mode)?.name}</span>
      <span class="tokens" data-testid="tokens" title="command tokens — {names.a || 'you'}: {night.tokens.a}, {names.b || 'them'}: {night.tokens.b}">
        {#each ['a', 'b'] as who (who)}
          <span class="tk {who}" class:cur={night.turn === who}>{night.tokens[who]}</span>
        {/each}
        {#if night.release && night.release.state === 'held'}
          <button class="rel" data-testid="release" onclick={() => (relOpen = !relOpen)} title="the release — {(night.release.holder === 'a' ? names.a : names.b) || 'current holder'} decides who finishes tonight">✦</button>
        {/if}
      </span>
      <span class="skips" data-testid="skips" title="skips left">
        {#each Array(skips) as _}<i></i>{/each}
      </span>
      <button class="icon-btn" onclick={goFullscreen} title="fullscreen for the TV" aria-label="Fullscreen"><Icon name="expand" /></button>
      <button class="icon-btn" onclick={() => { setMuted(!isMuted()); }} title={isMuted() ? 'sound off' : 'sound on'} data-testid="mute" aria-label={isMuted() ? 'Sound on' : 'Sound off'}><Icon name={isMuted() ? 'skip' : 'heart'} size={17} /></button>
    </div>

    <div class="cardzone">
      {#key card.id}
        <CardView {card} playerColor="p1" {soft} names={names} safeword={safeword} {landing} onSwipe={(dir) => (dir === 'next' ? next() : skip())} />
      {/key}
    </div>

    <nav class="dock glass" data-testid="dock">
      {#if landing}
        <button class="btn btn-primary" onclick={end} data-testid="finish">
          End the night warm <Icon name="heart" />
        </button>
      {:else if commanding}
        <div class="commandbanner" data-testid="command-banner">
          <Icon name="bomb" size={15} />
          {commanding === 'a' ? (names.a || 'You') : (names.b || 'They')} command{commanding === 'a' ? '' : 's'} — no skip, no soften. Then pass it on.
        </div>
        <button class="btn btn-primary" onclick={next} data-testid="next">
          Done <Icon name="pass" />
        </button>
      {:else}
        <button class="btn btn-ghost" onclick={() => (soft = !soft)} disabled={!card.soften} title="show the softer variant">
          <Icon name="soften" /> <span class="lbl">{soft ? 'Back up' : 'Soften'}</span>
        </button>
        <button class="btn btn-ghost" onclick={skip} disabled={skips <= 0} data-testid="skip" aria-label="Skip">
          <Icon name="skip" /> <span class="lbl">Skip</span>
        </button>
        <button class="btn btn-ghost retire" onclick={retire} title="never show this card again" aria-label="Never again">
          <Icon name="ban" /> <span class="lbl">Never again</span>
        </button>
        <button class="btn btn-ghost token" onclick={spendToken} disabled={(night.tokens?.[night.turn] ?? 0) <= 0} data-testid="token" title="spend a command token — the next card is an order that can't be refused">
          <Icon name="bomb" /> <span class="lbl">Command</span>
        </button>
        {#if relOpen && night.release && night.release.state === 'held'}
          <div class="rel-pop" data-testid="release-pop">
            <p class="rel-h dim">{(night.release.holder === 'a' ? names.a : names.b) || 'They'} hold{names.a || names.b ? 's' : ''} the release</p>
            {#if night.release.holder === night.turn}
              <button class="btn btn-ghost" onclick={giftRelease} data-testid="release-gift">Gift it — they decide</button>
              <button class="btn btn-ghost" onclick={spendRelease} data-testid="release-spend">Keep it — I finish</button>
            {:else}
              <p class="rel-h dim">tap the star again to close</p>
            {/if}
          </div>
        {/if}
        <button class="btn btn-primary" onclick={next} data-testid="next">
          Next <Icon name="pass" />
        </button>
        <button class="icon-btn end" onclick={end} title="end the night warm" aria-label="End the night"><Icon name="end" /></button>
      {/if}
    </nav>
  </main>
{:else if screen === 'celebrate'}
  <Celebration cards={count} nights={persisted.nights.length} history={persisted.nights} names={names} tokens={night.tokens ?? { a: 0, b: 0 }} release={releaseUsed} onAgain={() => begin()} onHome={home} />
{/if}

<style>
  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    z-index: 1;
    padding: clamp(12px, 2.4vmin, 28px);
    gap: clamp(10px, 2vmin, 20px);
    min-height: 0;
  }
  .topbar { display: flex; align-items: center; gap: 14px; }
  .modetag {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-dim);
  }
  .skips { display: inline-flex; gap: 5px; }
  .skips i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ember-soft);
    box-shadow: 0 0 8px rgba(255, 179, 92, 0.6);
  }
  .tokens { display: inline-flex; gap: 6px; align-items: center; }
  .tk {
    min-width: 22px; height: 22px; padding: 0 5px;
    display: grid; place-items: center;
    border-radius: var(--r-pill);
    font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums;
    border: 1px solid var(--edge);
    color: var(--ink-dim);
  }
  .tk.a { border-color: color-mix(in srgb, var(--p1) 55%, transparent); }
  .tk.b { border-color: color-mix(in srgb, var(--p2) 55%, transparent); }
  .tk.cur { color: var(--ink); box-shadow: 0 0 12px rgba(255, 122, 61, 0.25); }
  .tk.a.cur { background: color-mix(in srgb, var(--p1) 25%, transparent); }
  .tk.b.cur { background: color-mix(in srgb, var(--p2) 25%, transparent); }
  .commandbanner {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 20px; min-height: 52px;
    border-radius: var(--r-pill);
    background: linear-gradient(135deg, rgba(179, 69, 31, 0.5), rgba(143, 29, 58, 0.5));
    border: 1px solid var(--ember);
    color: #ffd9a0; font-weight: 700; font-size: clamp(13px, 1.8vmin, 16px);
    white-space: nowrap;
  }
  .rel {
    min-width: 22px; height: 22px;
    display: grid; place-items: center;
    border-radius: 50%;
    color: var(--ember-soft);
    font-size: 14px;
    background: none; border: none; padding: 0; cursor: pointer;
    box-shadow: 0 0 10px rgba(255, 179, 92, 0.4);
  }
  .rel-pop {
    position: fixed; left: 50%; bottom: 110px; transform: translateX(-50%);
    display: flex; flex-direction: column; gap: 8px; align-items: stretch;
    padding: 14px 18px; border-radius: var(--r-pill);
    background: var(--glass); border: 1px solid var(--ember);
    z-index: 30; min-width: 240px;
  }
  .rel-h { margin: 0; font-size: 12px; text-align: center; }
  .icon-btn {
    margin-left: auto;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--glass);
    border: 1px solid var(--edge);
    color: var(--ink-dim);
    transition: color 0.2s ease, transform 0.2s var(--spring);
  }
  .icon-btn:active { transform: scale(0.92); }
  .icon-btn.end { margin-left: 0; color: var(--ink-dim); }
  .cardzone { flex: 1; display: grid; place-items: center; min-height: 0; }
  .dock {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(8px, 1.8vmin, 16px);
    padding: clamp(10px, 1.8vmin, 16px);
    border-radius: 999px;
    flex-wrap: nowrap;
  }
  .dock .btn { white-space: nowrap; font-size: clamp(13px, 1.8vmin, 16px); padding: 12px 22px; min-height: 52px; }
  /* small screens: ghost buttons drop their labels (icons carry the meaning) so the dock never overflows the viewport */
  @media (max-width: 560px) {
    .dock { gap: 10px; }
    .dock .btn-ghost .lbl { display: none; }
    .dock .btn-ghost { padding: 12px 14px; }
  }
  .retire { color: var(--ink-dim); }

  /* ---- pass-the-phone handoff screen ---- */
  .pcwrap.handoff {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    padding: clamp(16px, 3vmin, 40px);
  }
  .handoff-card {
    width: min(92vw, 520px);
    display: flex; flex-direction: column; align-items: center; gap: clamp(14px, 2.4vmin, 24px);
    text-align: center;
    padding: clamp(24px, 4vmin, 48px);
    border-radius: var(--r-lg);
  }
  .crown-sm { color: var(--ember); }
  .handoff-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .btn.primary {
    background: linear-gradient(135deg, #ff7a3d, #ff5273); border-color: transparent;
    box-shadow: 0 10px 30px rgba(255, 90, 60, 0.3); color: #fff;
  }
  .btn.ghost {
    background: var(--glass); border: 1px solid var(--edge); color: var(--ink-dim);
    padding: 10px 18px; font-size: clamp(12px, 1.6vmin, 14px);
  }
  .handoff-card h2 { font-size: clamp(26px, 4.6vmin, 44px); }
  .handoff-card p { font-size: clamp(14px, 2vmin, 18px); line-height: 1.4; max-width: 40ch; }
</style>
