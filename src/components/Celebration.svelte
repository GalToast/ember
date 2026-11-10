<script lang="ts">
  import Icon from './Icon.svelte';
  let { cards, nights, history = [], names = { a: '', b: '' }, tokens = { a: 0, b: 0 }, release = null, onAgain, onHome }: {
    cards: number; nights: number; history?: { date: string; cards: number; mode: string }[];
    names?: { a: string; b: string }; tokens?: { a: number; b: number };
    release?: { holder: 'a' | 'b'; state: 'spent' | 'gifted' } | null;
    onAgain: () => void; onHome: () => void;
  } = $props();

  const lines = [
    'One thing you\'re celebrating about them tonight.',
    'One thing you\'re doing again — soon, on purpose.',
    'One thing you said tonight that was brave.',
  ];
  const totalCards = $derived(history.reduce((s, n) => s + n.cards, 0) + cards);
  const recent = $derived(history.slice(-3).reverse());
  const firstNight = $derived(history.length ? history[0].date.slice(5) : new Date().toISOString().slice(5));
  const longestNight = $derived(Math.max(cards, ...history.map((n) => n.cards)));
  const avgCards = $derived(history.length ? Math.round((history.reduce((s, n) => s + n.cards, 0) + cards) / (nights)) : cards);
  const LOVE_NAMES: Record<string, string> = { words: 'words', time: 'time together', touch: 'touch', service: 'care', gifts: 'surprises' };
  const topLove = $derived.by(() => {
    const totals: Record<string, number> = {};
    for (const n of history) for (const [k, v] of Object.entries(n.loves ?? {})) totals[k] = (totals[k] ?? 0) + v;
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    return top ? LOVE_NAMES[top[0]] : '';
  });
  const perWeek = $derived.by(() => {
    if (history.length < 2) return '';
    const t0 = new Date(history[0].date).getTime();
    const weeks = Math.max(1, (Date.now() - t0) / (7 * 864e5));
    return ((nights) / weeks).toFixed(1);
  });

  function exportHistory() {
    // plain-text keepsake — the story, not a database dump
    const who = `${names.a || 'You'} & ${names.b || 'them'}`;
    const lines = [`Ember — ${who}`, ''.padEnd(30, '~'), ''];
    for (const n of history) {
      lines.push(`${n.date} — ${n.cards} cards — ${n.mode}`);
    }
    lines.push('', `${nights} night${nights === 1 ? '' : 's'}, ${totalCards} cards.`, 'Say them out loud.');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ember-${who.replace(/[^a-z]+/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
</script>

<div class="wrap enter">
  <div class="glass panel" data-testid="celebration">
    <div class="crown"><Icon name="heart" size={30} /></div>
    <h2 class="display">What a night{names.a && names.b ? `, ${names.a} & ${names.b}` : ''}.</h2>
    <p class="stat dim">{cards} card{cards === 1 ? '' : 's'} tonight · night #{nights} of yours</p>
    {#if tokens.a + tokens.b > 0}
      <div class="finale" data-testid="token-finale">
        <Icon name="bomb" size={16} />
        <span>
          <!-- UX-6 (audit 2026-11-10): celebration tone. The token banner repeated the
               play-screen's threat voice ('No refusal.') at the peak-end moment — wrong
               register. The contract is real but it's a promise between the two of you,
               not an ultimatum from the app. -->
          {tokens.a + tokens.b} command token{tokens.a + tokens.b === 1 ? '' : 's'} unspent. 
          {#if tokens.a > 0 && tokens.b > 0}
            Neither spent everything — each of you names one unspent command before the week ends.
          {:else if tokens.a > 0}
            {names.a || 'You'} still hold {tokens.a} — name {tokens.a === 1 ? 'it' : 'them'} before the week ends.
          {:else}
            {names.b || 'They'} still hold {tokens.b} — name {tokens.b === 1 ? 'it' : 'them'} before the week ends.
          {/if}
        </span>
      </div>
    {/if}
    {#if nights >= 2}
      <p class="streak dim">{nights} nights · {totalCards} cards all time</p>
    {/if}
    {#if release}
      <p class="rel-line dim" data-testid="release-line">
        {#if release.state === 'spent'}{(release.holder === 'a' ? names.a : names.b) || 'One of you'} kept the release tonight.{:else}The release changed hands tonight — that's the good stuff.{/if}
      </p>
    {/if}
    {#if nights >= 3}
      <div class="insights" data-testid="insights">
        <div class="i-row"><span class="i-label">first night</span><span class="i-val">{firstNight}</span></div>
        <div class="i-row"><span class="i-label">longest night</span><span class="i-val">{longestNight} cards</span></div>
        <div class="i-row"><span class="i-label">avg night</span><span class="i-val">{avgCards} cards</span></div>
        {#if topLove}
          <div class="i-row"><span class="i-label">you run on</span><span class="i-val">{topLove}</span></div>
        {/if}
        {#if nights >= 5}
          <div class="i-row"><span class="i-label">weekly rhythm</span><span class="i-val">{perWeek}/week</span></div>
        {/if}
      </div>
    {/if}
    <ol>
      {#each lines as line (line)}
        <li>{line}</li>
      {/each}
    </ol>
    {#if recent.length > 0}
      <div class="history">
        <div class="h-label dim">your nights</div>
        {#each recent as n (n.date + n.mode)}
          <span class="h-chip">{n.date.slice(5)} · {n.cards} · {n.mode}</span>
        {/each}
      </div>
    {/if}
    <p class="dim close">Say them out loud. The phone can wait — it always could.</p>
    <div class="row">
      <button class="btn btn-ghost" onclick={onHome}>Change the mode</button>
      <button class="btn btn-primary" onclick={onAgain}>Keep going</button>
    </div>
    {#if nights >= 1}
      <button class="btn btn-ghost export" data-testid="export-history" onclick={exportHistory} title="write your night history to a text file — stays on your device until you share it">
        Write our story down
      </button>
    {/if}
  </div>
</div>

<style>
  .wrap { flex: 1; display: grid; place-items: center; padding: clamp(20px, 4vmin, 48px); z-index: 1; overflow-y: auto; }
  .panel {
    width: min(92vw, 640px);
    padding: clamp(26px, 4.6vmin, 52px);
    display: flex; flex-direction: column; align-items: center;
    gap: clamp(12px, 2.2vmin, 22px); text-align: center;
    box-shadow: var(--shadow-card), 0 0 40px rgba(255, 122, 61, 0.10);
  }
  .crown { color: var(--ember); filter: drop-shadow(0 0 18px rgba(255, 122, 61, 0.5)); }
  h2 { font-size: clamp(28px, 5.6vmin, 52px); }
  .stat {
    font-size: clamp(13px, 1.7vmin, 16px);
    letter-spacing: 0.08em;
    animation: countup 0.8s var(--spring) both;
  }
  @keyframes countup { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .streak { font-size: clamp(12px, 1.6vmin, 15px); color: var(--ember-soft); font-weight: 700; letter-spacing: 0.06em; }
  .rel-line { font-size: clamp(13px, 1.8vmin, 16px); color: var(--ember-soft); font-style: italic; }
  .insights {
    width: 100%; display: flex; flex-direction: column; gap: 8px;
    padding: 14px 18px; border-radius: 16px;
    background: var(--glass); border: 1px solid var(--edge);
  }
  .i-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .i-label { color: var(--ink-dim); font-size: clamp(12px, 1.6vmin, 14px); letter-spacing: 0.08em; text-transform: uppercase; }
  .i-val { color: var(--ink); font-weight: 700; font-size: clamp(14px, 2vmin, 18px); font-variant-numeric: tabular-nums; }
  .finale {
    display: flex; align-items: flex-start; gap: 10px;
    width: 100%;
    padding: 13px 16px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(179, 69, 31, 0.35), rgba(143, 29, 58, 0.3));
    border: 1px solid var(--ember);
    color: #ffd9a0; font-size: clamp(13px, 1.9vmin, 17px); font-weight: 600;
    text-align: left;
    line-height: 1.45;
  }
  ol { list-style: none; display: flex; flex-direction: column; gap: 10px; counter-reset: n; width: 100%; }
  li {
    counter-increment: n; padding: 14px 18px; border-radius: 16px;
    background: var(--glass); border: 1px solid var(--edge);
    font-size: clamp(15px, 2.2vmin, 20px);
  }
  li::before {
    content: counter(n);
    display: inline-grid; place-items: center; width: 24px; height: 24px; margin-right: 10px;
    border-radius: 50%; background: linear-gradient(135deg, var(--ember), var(--p2));
    font-size: 13px; font-weight: 800;
  }
  .history { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
  .h-label { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; width: 100%; }
  .h-chip {
    padding: 6px 14px; border-radius: 999px; background: var(--glass);
    border: 1px solid var(--edge); font-size: clamp(11px, 1.5vmin, 13px);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s var(--spring);
  }
  .h-chip:hover { border-color: var(--ember); color: var(--ink); box-shadow: 0 0 12px rgba(255, 122, 61, 0.25); transform: scale(1.05); }
  .close { font-size: clamp(13px, 1.8vmin, 16px); font-style: italic; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
  .export { margin-top: 10px; font-size: clamp(13px, 1.7vmin, 15px); opacity: 0.85; }
</style>
