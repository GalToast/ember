<script lang="ts">
  import type { Card } from '../lib/schema';
  import Icon from './Icon.svelte';

  let { card, playerColor, soft }: { card: Card; playerColor: 'p1' | 'p2'; soft?: boolean } = $props();

  const isSoft = $derived(soft === true);
  const shown = $derived(isSoft && card.soften ? { ...card, text: card.soften, speak: undefined, timebox: undefined } : card);
  const typeIcon = $derived(shown.type as 'truth' | 'dare' | 'challenge' | 'ice' | 'topic');
  const typeName = $derived(shown.type.toUpperCase());

  // timer
  let remaining = $state(0);
  let total = $state(0);
  let running = $state(false);
  let interval: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    total = shown.timebox ?? 0;
    remaining = total;
    running = total > 0;
    if (interval) clearInterval(interval);
    if (total > 0) {
      interval = setInterval(() => {
        if (running && remaining > 0) remaining -= 1;
        if (remaining === 0 && running) {
          running = false;
          import('../lib/game.svelte').then((m) => m.chime());
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  });

  const ringStyle = $derived(
    total > 0
      ? `background: conic-gradient(currentColor ${(remaining / Math.max(total, 1)) * 360}deg, rgba(255,255,255,0.08) 0deg);`
      : '',
  );
</script>

<div class="card {playerColor} {isSoft ? 'soft' : ''} {shown.bomb ? 'bomb' : ''}" data-testid="card">
  {#if shown.bomb && !isSoft}
    <div class="bomb-badge pop"><Icon name="bomb" size={18} /> SPICE BOMB</div>
  {/if}

  <div class="badge" class:bomb={shown.bomb}>
    <Icon name={typeIcon} size={18} />
    <span>{isSoft ? 'SOFTER TAKE' : typeName}</span>
    <span class="flames">{#each Array(shown.level) as _}<Icon name="flame" size={13} />{/each}</span>
  </div>

  <p class="text display">{shown.text}</p>

  {#if shown.speak && !isSoft}
    <div class="speak">
      <div class="speak-label"><Icon name="truth" size={15} /> say this while it happens</div>
      <p>{shown.speak}</p>
    </div>
  {/if}

  {#if total > 0}
    <div class="timer" class:done={remaining === 0} style={ringStyle}>
      <div class="timer-inner">
        {#if remaining === 0}
          <span>take your time anyway</span>
        {:else}
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .card {
    position: relative;
    width: min(92vw, 68vmin);
    max-height: 78dvh;
    overflow-y: auto;
    padding: clamp(22px, 4vmin, 44px);
    border-radius: 30px;
    display: flex;
    flex-direction: column;
    gap: clamp(14px, 2.4vmin, 26px);
    text-align: center;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
  }
  .card.p1 { box-shadow: 0 30px 90px rgba(27, 77, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
  .card.p2 { box-shadow: 0 30px 90px rgba(143, 29, 58, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
  .card.p1 :global(.badge) { color: var(--p1); }
  .card.p2 :global(.badge) { color: var(--p2); }
  .card.bomb { box-shadow: 0 30px 100px rgba(255, 122, 61, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12); border-color: rgba(255, 122, 61, 0.45); }
  .card.soft { opacity: 0.92; }

  .bomb-badge {
    position: absolute;
    top: -14px;
    right: 18px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #ffd9a0;
    background: linear-gradient(135deg, #b3451f, #8f1d3a);
    box-shadow: 0 8px 24px rgba(179, 69, 31, 0.5);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    font-size: clamp(11px, 1.5vmin, 14px);
    font-weight: 800;
    letter-spacing: 0.14em;
  }
  .badge.bomb { color: var(--ember-soft); }
  .flames { display: inline-flex; gap: 1px; opacity: 0.85; }

  .text {
    font-size: clamp(24px, 5vmin, 54px);
    line-height: 1.18;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  .speak {
    width: 100%;
    padding: clamp(12px, 2vmin, 20px) clamp(14px, 2.4vmin, 24px);
    border-radius: 18px;
    background: rgba(255, 179, 92, 0.08);
    border: 1px solid rgba(255, 179, 92, 0.3);
  }
  .speak-label {
    display: flex;
    align-items: center;
    gap: 7px;
    justify-content: center;
    font-size: clamp(10px, 1.4vmin, 13px);
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ember-soft);
    margin-bottom: 8px;
  }
  .speak p {
    font-size: clamp(15px, 2.4vmin, 24px);
    font-style: italic;
    line-height: 1.35;
    color: var(--ink);
  }

  .timer {
    width: clamp(84px, 14vmin, 130px);
    aspect-ratio: 1;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ember-soft);
    padding: 5px;
  }
  .timer.done { color: var(--ink-dim); }
  .timer-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(11, 13, 20, 0.92);
    display: grid;
    place-items: center;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: clamp(15px, 2.6vmin, 24px);
    padding: 8px;
    text-align: center;
  }
</style>
