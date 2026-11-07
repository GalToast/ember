<script lang="ts">
  import Mesh from './components/Mesh.svelte';
  import Setup from './components/Setup.svelte';
  import Splash from './components/Splash.svelte';
  import CardView from './components/Card.svelte';
  import Celebration from './components/Celebration.svelte';
  import Icon from './components/Icon.svelte';
  import { draw, drawWarmLanding, load, save, loadNight, saveNight, clearNight, trackLove, unlockAudio, type Mode, MODES, ALL_DECKS } from './lib/game.svelte';
  import type { Card, DeckId } from './lib/schema';

  const persisted = $state(load());
  let names = $state(persisted.names);
  let mode = $state<Mode>('mixup');
  let decks = $state<DeckId[]>([...ALL_DECKS.filter((d) => d !== 'inferno')]);
  let safeword = $state('');
  let screen = $state<'setup' | 'splash' | 'play' | 'celebrate'>('setup');
  let card = $state<Card | null>(null);
  let soft = $state(false);
  let skips = $state(6);
  let count = $state(0);
  let landing = $state(false);
  let resumeAvailable = $state(loadNight());
  let wakeLock: { release: () => Promise<void> } | null = null;

  const night = $state(loadNight() ?? {
    mode: 'mixup' as Mode, decks: [...decks], cardId: null, count: 0, skips: 6,
    seen: [] as string[], loveCounts: {}, drawIndex: 0, lastBombIndex: -99, safeword: '', landing: false,
  });

  function persistNight() {
    night.decks = [...decks];
    night.mode = mode;
    night.cardId = card?.id ?? null;
    night.count = count;
    night.skips = skips;
    night.safeword = safeword;
    night.landing = landing;
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
    const c = draw(mode, decks, persisted.retired, night, except);
    if (!c) { end(); return; }
    card = c;
    soft = false;
    count += 1;
    night.drawIndex += 1;
    trackLove(night, c);
    landing = false;
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

  function retire() {
    if (!card) return;
    persisted.retired = [...persisted.retired, card.id];
    save(persisted);
    advance(card);
  }

  function begin() {
    unlockAudio();
    lockScreen();
    next();
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
    const all = n.decks?.flatMap((id) => (window as unknown as { __EMBER_DECKS__?: never }) && id) ?? [];
    // rebuild the card from the deck data via a draw restricted to its deck
    const deckId = n.cardId?.split('-')[0] as DeckId;
    const c = deckId ? (window as unknown as { __EMBER_CARD_LOOKUP__?: unknown }) : null;
    void c; void all;
    card = lookupCard(n.cardId ?? '');
    if (card) {
      night.seen = n.seen || [];
      night.loveCounts = n.loveCounts || {};
      night.drawIndex = n.drawIndex || 0;
      night.lastBombIndex = n.lastBombIndex ?? -99;
      for (const id of night.seen) import('./lib/game.svelte').then(() => {}); // seen tracked via draw()
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
    save({
      names,
      nights: [...persisted.nights, { date: new Date().toISOString().slice(0, 10), cards: count, mode }],
      retired: persisted.retired,
    });
    persisted.nights = load().nights;
    clearNight();
    unlockScreen();
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
    onRestart={() => { clearNight(); resumeAvailable = null; count = 0; skips = 6; }}
    onStart={() => { clearNight(); (screen = 'splash'); }}
  />
{:else if screen === 'splash'}
  <Splash onBegin={begin} />
{:else if screen === 'play' && card}
  <main class="stage" data-testid="stage">
    <div class="topbar">
      <span class="modetag">{landing ? 'the landing' : MODES.find((m) => m.id === mode)?.name}</span>
      <span class="skips" data-testid="skips" title="skips left">
        {#each Array(skips) as _}<i></i>{/each}
      </span>
      <button class="icon-btn" onclick={goFullscreen} title="fullscreen for the TV"><Icon name="expand" /></button>
    </div>

    <div class="cardzone">
      {#key card.id}
        <CardView {card} playerColor="p1" {soft} names={names} safeword={safeword} {landing} />
      {/key}
    </div>

    <nav class="dock glass" data-testid="dock">
      {#if !landing}
        <button class="btn btn-ghost" onclick={() => (soft = !soft)} disabled={!card.soften} title="show the softer variant">
          <Icon name="soften" /> {soft ? 'Back up' : 'Soften'}
        </button>
        <button class="btn btn-ghost" onclick={skip} disabled={skips <= 0} data-testid="skip">
          <Icon name="skip" /> Skip
        </button>
        <button class="btn btn-ghost retire" onclick={retire} title="never show this card again">
          <Icon name="skip" /> Never again
        </button>
      {/if}
      {#if landing}
        <button class="btn btn-primary" onclick={end} data-testid="finish">
          End the night warm <Icon name="heart" />
        </button>
      {:else}
        <button class="btn btn-primary" onclick={landing ? end : next} data-testid="next">
          Next <Icon name="pass" />
        </button>
        <button class="icon-btn end" onclick={end} title="end the night warm"><Icon name="end" /></button>
      {/if}
    </nav>
  </main>
{:else if screen === 'celebrate'}
  <Celebration cards={count} nights={persisted.nights.length} history={persisted.nights} names={names} onAgain={begin} onHome={home} />
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
  .retire { color: var(--ink-dim); }
</style>
