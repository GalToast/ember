<script lang="ts">
  import type { Card } from '../lib/schema';
  import Icon from './Icon.svelte';

  /**
   * PrivateCard — the pass-the-phone reveal.
   * The phone holder sees the card ONLY while actively pressing the reveal pad.
   * Release (or hand-off detection = pointer leaves) and it re-hides instantly.
   * No screenshots-friendly: text is blurred until press. Nobody else sees it.
   */
  let {
    card,
    holder, // 'a' | 'b' — whose private card this is
    names = { a: '', b: '' },
    onDone,
  }: {
    card: Card | null;
    holder: 'a' | 'b';
    names?: { a: string; b: string };
    onDone?: () => void;
  } = $props();

  let holding = $state(false);
  let revealed = $state(false); // latched reveal after 3 holds (peek forever this turn)
  let holdCount = $state(0);

  const holderName = $derived(holder === 'a' ? (names.a || 'Player 1') : (names.b || 'Player 2'));
  const visible = $derived(holding || revealed);

  function down() {
    holding = true;
    holdCount += 1;
    if (holdCount >= 3) revealed = true; // pressed 3 times: it's yours to keep reading
  }
  function up() { holding = false; }
  function leave() { holding = false; }
</script>

<div class="pcwrap" data-testid="private-card">
  <div class="pc-meta">
    <span class="pc-who" data-testid="pc-holder">{holderName}'s private card</span>
    <span class="dim pc-hint">{revealed ? 'yours until you pass' : 'press and hold to read — nobody else sees it'}</span>
  </div>

  {#if card}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="pcard {visible ? 'open' : 'sealed'} {holder}"
      onpointerdown={down}
      onpointerup={up}
      onpointerleave={leave}
      onpointercancel={up}
      role="button"
      tabindex="0"
      aria-hidden={!visible}
    >
      {#if visible}
        <header class="pc-top">
          <span class="type"><Icon name={card.type as 'truth'} size={15} /> {card.type.toUpperCase()}</span>
          <span class="dots">{#each Array(4) as _, i (i)}<i class:on={i < card.level}></i>{/each}</span>
        </header>
        <p class="pc-text">{card.text}</p>
        {#if card.speak}
          <aside class="pc-speak"><Icon name="truth" size={12} /> {card.speak}</aside>
        {/if}
        {#if card.timebox}
          <div class="pc-time"><Icon name="skip" size={12} /> {Math.floor(card.timebox / 60)}:{String(card.timebox % 60).padStart(2, '0')} — go somewhere private</div>
        {/if}
      {:else}
        <div class="seal">
          <Icon name="heart" size={34} />
          <p class="seal-word">{holderName} only</p>
          <p class="seal-dim dim">hold to read · 3 presses to keep it open</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="pcard sealed"><div class="seal"><p class="seal-word dim">no private card drawn</p></div></div>
  {/if}

  <button class="btn done" onclick={onDone} data-testid="pc-done">
    {revealed ? 'Read it — pass the phone' : 'Pass without reading'} <Icon name="pass" />
  </button>
</div>

<style>
  .pcwrap { flex: 1; display: flex; flex-direction: column; gap: clamp(10px, 2vmin, 20px); align-items: center; justify-content: center; min-height: 0; padding: clamp(12px, 2.4vmin, 28px); z-index: 1; }
  .pc-meta { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .pc-who { font-weight: 800; letter-spacing: 0.08em; font-size: clamp(15px, 2.2vmin, 20px); }
  .pc-hint { font-size: clamp(11px, 1.5vmin, 13px); }
  .pcard {
    width: min(92vw, 68vmin);
    aspect-ratio: 0.72;
    border-radius: var(--r-lg);
    display: flex; flex-direction: column; gap: clamp(12px, 2vmin, 20px);
    align-items: center; justify-content: center; text-align: center;
    padding: clamp(20px, 3.6vmin, 40px);
    border: 1px solid var(--edge);
    transition: filter 0.25s ease, transform 0.25s var(--spring);
    user-select: none; -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
  }
  .pcard.sealed { background: var(--glass-strong); backdrop-filter: blur(28px); }
  .pcard.open.a { background: linear-gradient(160deg, rgba(90,167,255,0.14), rgba(255,255,255,0.02)), var(--glass-strong); border-color: color-mix(in srgb, var(--p1) 60%, transparent); }
  .pcard.open.b { background: linear-gradient(160deg, rgba(255,82,115,0.14), rgba(255,255,255,0.02)), var(--glass-strong); border-color: color-mix(in srgb, var(--p2) 60%, transparent); }
  .seal { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--ink-dim); }
  .seal-word { font-family: var(--font-display); font-size: clamp(20px, 3.4vmin, 30px); font-weight: 600; color: var(--ink); }
  .seal-dim { font-size: clamp(11px, 1.5vmin, 13px); }
  .pc-top { display: flex; align-items: center; gap: 12px; color: var(--ink-dim); }
  .type { display: inline-flex; align-items: center; gap: 6px; font-size: clamp(10px, 1.4vmin, 12px); font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .dots { display: inline-flex; gap: 4px; }
  .dots i { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.18); }
  .dots i.on { background: currentColor; box-shadow: 0 0 6px currentColor; }
  .pc-text {
    font-family: var(--font-display);
    font-variation-settings: 'SOFT' 55, 'WONK' 1, 'opsz' 72;
    font-weight: 580; line-height: 1.2; text-wrap: pretty;
    font-size: clamp(20px, 4.4vmin, 42px);
    overflow-wrap: break-word;
  }
  .pc-speak {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 14px; border-radius: var(--r-sm);
    background: rgba(255, 179, 92, 0.08); border-left: 2px solid var(--ember-soft);
    color: var(--ember-soft); font-style: italic;
    font-size: clamp(14px, 2.1vmin, 20px);
  }
  .pc-time { display: flex; align-items: center; gap: 6px; color: var(--ink-dim); font-size: clamp(11px, 1.5vmin, 13px); }
  .btn.done {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; min-height: 52px; border-radius: var(--r-pill);
    background: linear-gradient(135deg, #ff7a3d, #ff5273); color: #fff;
    font-size: clamp(14px, 2vmin, 17px); font-weight: 700;
    box-shadow: 0 10px 30px rgba(255, 90, 60, 0.3);
  }
</style>
