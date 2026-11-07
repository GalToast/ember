<script lang="ts">
  import Icon from './Icon.svelte';
  let { cards, nights, onAgain, onHome }: { cards: number; nights: number; onAgain: () => void; onHome: () => void } = $props();

  const lines = [
    'One thing you\'re celebrating about them tonight.',
    'One thing you\'re doing again — soon, on purpose.',
    'One thing you said tonight that was brave.',
  ];
</script>

<div class="wrap enter">
  <div class="glass panel" data-testid="celebration">
    <div class="crown"><Icon name="heart" size={30} /></div>
    <h2 class="display">What a night.</h2>
    <p class="stat dim">{cards} cards · night #{nights + 1} of yours</p>
    <ol>
      {#each lines as line (line)}
        <li>{line}</li>
      {/each}
    </ol>
    <p class="dim close">Say them out loud. The phone can wait — it always could.</p>
    <div class="row">
      <button class="btn btn-ghost" onclick={onHome}>Change the mode</button>
      <button class="btn btn-primary" onclick={onAgain}>Keep going</button>
    </div>
  </div>
</div>

<style>
  .wrap { flex: 1; display: grid; place-items: center; padding: clamp(20px, 4vmin, 48px); z-index: 1; }
  .panel {
    width: min(92vw, 640px);
    padding: clamp(26px, 4.6vmin, 52px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(12px, 2.2vmin, 22px);
    text-align: center;
  }
  .crown { color: var(--ember); filter: drop-shadow(0 0 18px rgba(255, 122, 61, 0.5)); }
  h2 { font-size: clamp(30px, 6vmin, 54px); }
  .stat { font-size: clamp(13px, 1.7vmin, 16px); letter-spacing: 0.08em; }
  ol {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    counter-reset: n;
    width: 100%;
  }
  li {
    counter-increment: n;
    padding: 14px 18px;
    border-radius: 16px;
    background: var(--glass);
    border: 1px solid var(--edge);
    font-size: clamp(15px, 2.2vmin, 20px);
  }
  li::before {
    content: counter(n);
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-right: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--ember), var(--p2));
    font-size: 13px;
    font-weight: 800;
  }
  .close { font-size: clamp(13px, 1.8vmin, 16px); font-style: italic; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
</style>
