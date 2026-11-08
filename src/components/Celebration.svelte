<script lang="ts">
  import Icon from './Icon.svelte';
  let { cards, nights, history = [], names = { a: '', b: '' }, onAgain, onHome }: {
    cards: number; nights: number; history?: { date: string; cards: number; mode: string }[];
    names?: { a: string; b: string }; onAgain: () => void; onHome: () => void;
  } = $props();

  const lines = [
    'One thing you\'re celebrating about them tonight.',
    'One thing you\'re doing again — soon, on purpose.',
    'One thing you said tonight that was brave.',
  ];
  const totalCards = $derived(history.reduce((s, n) => s + n.cards, 0) + cards);
  const recent = $derived(history.slice(-3).reverse());
</script>

<div class="wrap enter">
  <div class="glass panel" data-testid="celebration">
    <div class="crown"><Icon name="heart" size={30} /></div>
    <h2 class="display">What a night{names.a && names.b ? `, ${names.a} & ${names.b}` : ''}.</h2>
    <p class="stat dim">{cards} cards tonight · night #{nights} of yours</p>
    {#if nights >= 2}
      <p class="streak dim">{nights} nights · {totalCards} cards all time</p>
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
</style>
