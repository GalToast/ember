<script lang="ts">
  import type { Card, DeckId } from '../lib/schema';
  import { heatDots } from '../lib/heat';
  import { DECKS, ALL_DECKS } from '../lib/game.svelte';
  import Icon from './Icon.svelte';

  let {
    retired = [],
    onRetire,
    onUnretire,
    onClose,
  }: {
    retired?: string[];
    onRetire?: (id: string) => void;
    onUnretire?: (id: string) => void;
    onClose?: () => void;
  } = $props();

  let deck = $state<DeckId>('spark');
  let index = $state(0);
  let soft = $state(false);

  // one-time on mount: if cards have been retired, open on the most recent one
  // (review-your-retires: restore or confirm, without hunting for it)
  let initialized = false;
  $effect(() => {
    if (initialized) return;
    initialized = true;
    const rid = retired[retired.length - 1];
    if (!rid) return;
    const d = rid.split('-')[0] as DeckId;
    const i = DECKS[d]?.cards.findIndex((c) => c.id === rid) ?? -1;
    if (d && DECKS[d] && i >= 0) {
      deck = d;
      index = i;
    }
  });

  const cards = $derived(DECKS[deck]?.cards ?? []);
  const card = $derived(cards[index] as Card | undefined);
  const isRetired = $derived(card ? retired.includes(card.id) : false);
  const isSoft = $derived(soft === true && !!card?.soften);
  const shown = $derived(isSoft && card ? { ...card, text: card.soften!, speak: undefined, timebox: undefined } : card);

  function pickDeck(id: DeckId) {
    deck = id;
    index = 0;
    soft = false;
  }
  function next() { if (index < cards.length - 1) { index += 1; soft = false; } else { index = 0; soft = false; } }
  function prev() { if (index > 0) { index -= 1; soft = false; } else { index = cards.length - 1; soft = false; } }
  function toggleRetire() {
    if (!card) return;
    if (isRetired) onUnretire?.(card.id);
    else onRetire?.(card.id);
  }

  const typeIcon = $derived(shown?.type as 'truth' | 'dare' | 'challenge' | 'ice' | 'topic');
  const sizeClass = $derived.by(() => {
    if (!shown) return 'md';
    const len = shown.text.length + (shown.speak ? shown.speak.length * 1.6 : 0);
    if (len <= 80) return 'xl';
    if (len <= 145) return 'lg';
    if (len <= 210) return 'md';
    return 'sm';
  });
</script>

<div class="wrap enter" data-testid="browse">
  <header class="head">
    <button class="icon-btn" onclick={onClose} title="back to setup" data-testid="browse-close" aria-label="Back to setup"><Icon name="skip" /> Back</button>
    <div class="brand"><Icon name="heart" size={18} /> Browse the decks</div>
    <!-- UX-7 (audit 2026-11-10): '1 / 100' 12px dim text was the only orientation cue;
         a deck-colored progress bar gives position at a glance in a dark room. -->
    <div class="prog" aria-hidden="true">
      <div class="prog-fill" style="width: {((index + 1) / cards.length) * 100}%"></div>
    </div>
    <span class="dim pos">{index + 1} / {cards.length}</span>
  </header>

  <nav class="deckrow" data-testid="browse-decks">
    {#each ALL_DECKS as id (id)}
      <button class="dchip" class:on={deck === id} class:adult={DECKS[id]?.adult} onclick={() => pickDeck(id)}>
        {DECKS[id]?.name}<span class="count dim">{DECKS[id]?.cards.length}</span>
      </button>
    {/each}
  </nav>

  {#if shown}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bcard {deck === 'inferno' || shown.bomb ? 'hot' : ''} {isSoft ? 'soft' : ''} {isRetired ? 'retired' : ''}"
      data-testid="browse-card"
    >
      {#if shown.bomb && !isSoft}
        <div class="badge"><Icon name="bomb" size={14} /> SPICE BOMB</div>
      {/if}
      <header class="meta">
        <span class="type"><Icon name={typeIcon} size={15} /> {shown.type.toUpperCase()}</span>
        <span class="dots">{#each heatDots(shown.level) as state, i (i)}<i class:on={state === 'on'} class:half={state === 'half'}></i>{/each}</span>
      </header>
      <p class="text {sizeClass}">{shown.text}</p>
      {#if shown.speak && !isSoft}
        <aside class="speak">
          <div class="speak-label"><Icon name="truth" size={12} /> say this while it happens</div>
          <p>{shown.speak}</p>
        </aside>
      {/if}
      {#if isRetired}
        <div class="retirednote">retired — this card will never draw during nights</div>
      {/if}
    </div>
  {/if}

  <nav class="controls" data-testid="browse-controls">
    <button class="btn" onclick={prev}><Icon name="skip" /> Prev</button>
    <button class="btn" onclick={() => (soft = !soft)} disabled={!card?.soften}>
      <Icon name="soften" /> {isSoft ? 'Back up' : 'Soften'}
    </button>
    <button class="btn retire" class:on={isRetired} onclick={toggleRetire}>
      <Icon name="skip" /> {isRetired ? 'Restore' : 'Never again'}
    </button>
    <button class="btn primary" onclick={next}>Next <Icon name="pass" /></button>
  </nav>
</div>

<style>
  .wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 1.8vmin, 18px);
    z-index: 1;
    padding: clamp(12px, 2.4vmin, 28px);
    min-height: 0;
  }
  .head { display: flex; align-items: center; gap: 10px; }
  .brand { font-weight: 800; letter-spacing: 0.08em; font-size: clamp(13px, 1.8vmin, 16px); white-space: nowrap; }
  .pos { margin-left: auto; font-variant-numeric: tabular-nums; font-size: clamp(12px, 1.6vmin, 14px); white-space: nowrap; }
  /* UX-7: deck progress bar — position at a glance, deck-colored */
  .prog {
    margin-left: auto; width: 56px; flex: none; height: 3px; border-radius: 2px;
    background: var(--glass); overflow: hidden;
  }
  .prog + .pos { margin-left: 10px; }
  .prog-fill { height: 100%; border-radius: 2px; background: var(--ember-soft); transition: width 0.25s var(--spring); }
  .icon-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: var(--r-pill);
    background: var(--glass); border: 1px solid var(--edge); color: var(--ink-dim);
    font-size: 13px; font-weight: 700;
  }
  .deckrow { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
  .dchip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: var(--r-pill); min-height: 34px;
    font-size: clamp(11px, 1.5vmin, 13px); font-weight: 600;
    background: var(--glass); border: 1px solid var(--edge); color: var(--ink);
    transition: all 0.2s var(--spring);
  }
  .dchip .count { font-size: 11px; font-weight: 400; }
  .dchip.on {
    background: linear-gradient(135deg, rgba(255, 122, 61, 0.22), rgba(255, 82, 115, 0.22));
    border-color: var(--ember); box-shadow: 0 0 20px rgba(255, 122, 61, 0.18);
  }
  .dchip.adult:not(.on) { border-color: rgba(255, 82, 115, 0.35); }

  .bcard {
    position: relative;
    flex: 1;
    min-height: 0;
    width: min(92vw, 68vmin);
    margin: 0 auto;
    overflow: hidden;
    padding: clamp(20px, 3.6vmin, 40px);
    border-radius: var(--r-lg);
    display: flex; flex-direction: column; gap: clamp(12px, 2.2vmin, 22px);
    text-align: center; align-items: center; justify-content: center;
    background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), var(--glass-strong);
    border: 1px solid var(--edge);
    backdrop-filter: blur(28px) saturate(140%);
    -webkit-backdrop-filter: blur(28px) saturate(140%);
    box-shadow: var(--shadow-card);
  }
  .bcard.hot {
    background: linear-gradient(160deg, rgba(255,122,61,0.10), rgba(255,82,115,0.06)), var(--glass-strong);
    border-color: rgba(255, 140, 70, 0.4);
  }
  .bcard.retired { opacity: 0.45; }
  .badge {
    position: absolute; top: 10px; right: 14px;
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 11px; border-radius: var(--r-pill);
    font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
    color: #ffd9a0; background: linear-gradient(135deg, #b3451f, #8f1d3a);
  }
  .meta { display: flex; align-items: center; gap: 12px; color: var(--ink-dim); }
  .type { display: inline-flex; align-items: center; gap: 6px; font-size: clamp(10px, 1.4vmin, 12px); font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .dots { display: inline-flex; gap: 4px; }
  .dots i { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.18); }
  .dots i.on { background: currentColor; box-shadow: 0 0 6px currentColor; }
  .text {
    font-family: var(--font-display);
    font-variation-settings: 'SOFT' 55, 'WONK' 1, 'opsz' 72;
    font-weight: 580; letter-spacing: -0.01em; line-height: 1.16; text-wrap: pretty;
    overflow-wrap: break-word;
  }
  .text.xl { font-size: clamp(25px, 5.8vmin, 58px); }
  .text.lg { font-size: clamp(23px, 5vmin, 48px); }
  .text.md { font-size: clamp(20px, 4.2vmin, 40px); line-height: 1.22; }
  .text.sm { font-size: clamp(18px, 3.6vmin, 33px); line-height: 1.3; }
  .speak {
    width: 100%; padding: clamp(10px, 1.8vmin, 16px);
    border-radius: var(--r-sm);
    background: rgba(255, 179, 92, 0.07); border-left: 2px solid var(--ember-soft);
    text-align: left;
  }
  .speak-label { display: flex; align-items: center; gap: 6px; font-size: clamp(9px, 1.2vmin, 11px); font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ember-soft); margin-bottom: 6px; }
  .speak p { font-family: var(--font-display); font-style: italic; font-size: clamp(15px, 2.3vmin, 23px); color: var(--ink); }
  .retirednote { font-size: clamp(11px, 1.4vmin, 13px); color: var(--ink-dim); }
  .controls { display: flex; gap: clamp(8px, 1.6vmin, 14px); justify-content: center; flex-wrap: wrap; }
  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 18px; min-height: 48px; border-radius: var(--r-pill);
    background: var(--glass); border: 1px solid var(--edge); color: var(--ink);
    font-size: clamp(13px, 1.8vmin, 15px); font-weight: 700; white-space: nowrap;
    transition: all 0.2s var(--spring);
  }
  .btn:active { transform: scale(0.96); }
  .btn.retire { color: var(--ink-dim); }
  .btn.retire.on { color: var(--p2); border-color: var(--p2); }
  .btn.primary { background: linear-gradient(135deg, #ff7a3d, #ff5273); border-color: transparent; box-shadow: 0 10px 30px rgba(255, 90, 60, 0.3); }
  .btn:disabled { opacity: 0.4; }
</style>
