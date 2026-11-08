<script lang="ts">
  import type { Card } from '../lib/schema';
  import Icon from './Icon.svelte';
  import { haptics } from '../lib/haptics';

  let {
    card,
    playerColor,
    soft,
    names = { a: '', b: '' },
    safeword = '',
    landing = false,
    onSwipe,
  }: {
    card: Card;
    playerColor: 'p1' | 'p2';
    soft?: boolean;
    names?: { a: string; b: string };
    safeword?: string;
    landing?: boolean;
    onSwipe?: (dir: 'next' | 'skip') => void;
  } = $props();

  const isSoft = $derived(soft === true);
  const raw = $derived(isSoft && card.soften ? { ...card, text: card.soften, speak: undefined, timebox: undefined } : card);

  const sizeClass = $derived.by(() => {
    const len = raw.text.length + (raw.speak ? raw.speak.length * 1.6 : 0) + (raw.timebox ? 40 : 0);
    if (len <= 80) return 'xl';
    if (len <= 145) return 'lg';
    if (len <= 210) return 'md';
    if (len <= 260) return 'sm';
    return 'xs';
  });

  const fill = (s: string | undefined) =>
    s ? s.replaceAll('{a}', names.a || 'you').replaceAll('{b}', names.b || 'them') : s;

  const shown = $derived({ ...raw, text: fill(raw.text), speak: fill(raw.speak), soften: fill(raw.soften) });
  const typeIcon = $derived(shown.type as 'truth' | 'dare' | 'challenge' | 'ice' | 'topic');
  const typeName = $derived(shown.type.toUpperCase());

  // ---- swipe physics ----
  let dragging = $state(false);
  let dx = $state(0);
  let fly = $state<'none' | 'right' | 'left'>('none');
  const THRESHOLD = 96;
  const flyStyle = $derived.by(() => {
    if (fly === 'right') return 'transform: translateX(130%) rotate(14deg); opacity: 0;';
    if (fly === 'left') return 'transform: translateX(-130%) rotate(-14deg); opacity: 0;';
    return '';
  });
  const dragStyle = $derived(
    dragging ? `transform: translateX(${dx}px) rotate(${dx / 20}deg); transition: none;` : '',
  );
  const hint = $derived.by(() => {
    if (!dragging || Math.abs(dx) < 36) return '';
    return dx > 0 ? 'next' : 'skip';
  });

  let startX = 0;
  let startY = 0;

  function down(e: PointerEvent) {
    if (fly !== 'none') return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    const nx = e.clientX - startX;
    const ny = e.clientY - startY;
    // vertical intent → hand the gesture back to native scrolling
    if (Math.abs(ny) > Math.abs(nx) && Math.abs(ny) > 14) {
      dragging = false;
      dx = 0;
      return;
    }
    dx = nx;
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    if (dx > THRESHOLD) flyCard('right');
    else if (dx < -THRESHOLD) flyCard('left');
    dx = 0;
  }
  function flyCard(dir: 'right' | 'left') {
    fly = dir;
    dir === 'right' ? haptics.next() : haptics.skip();
    setTimeout(() => {
      fly = 'none';
      if (!landing) onSwipe?.(dir === 'right' ? 'next' : 'skip');
    }, 190);
  }

  // ---- timer ----
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

  // haptics: double 10ms pulse when a fresh spice bomb is dealt
  let bombPulsed = $state(false);
  $effect(() => {
    const isBomb = shown.bomb && !isSoft;
    if (isBomb && !bombPulsed) { haptics.bomb(); bombPulsed = true; }
    if (!isBomb) bombPulsed = false;
  });

  const ringStyle = $derived(
    total > 0
      ? `background: conic-gradient(currentColor ${(remaining / Math.max(total, 1)) * 360}deg, rgba(255,255,255,0.07) 0deg);`
      : '',
  );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="card deal {playerColor} {isSoft ? 'soft' : ''} {shown.bomb ? 'bomb' : ''} {shown.level === 4 ? 'l4' : ''} {fly !== 'none' ? 'flying' : ''}"
  style="{dragStyle} {flyStyle}"
  data-testid="card"
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
>
  <div class="hairline" aria-hidden="true"></div>

  {#if hint}
    <div class="swipe-hint {hint} pop">{hint === 'next' ? 'NEXT' : 'SKIP'}</div>
  {/if}

  {#if shown.bomb && !isSoft}
    <div class="badge-badge pop"><Icon name="bomb" size={15} /> SPICE BOMB</div>
  {:else if landing}
    <div class="badge-badge landing pop"><Icon name="heart" size={14} /> THE LANDING</div>
  {/if}

  <header class="meta">
    <span class="type"><Icon name={typeIcon} size={16} /> {isSoft ? 'Softer take' : typeName}</span>
    <span class="dots" title="heat level">
      {#each Array(4) as _, i (i)}
        <i class:on={i < shown.level}></i>
      {/each}
    </span>
  </header>

  <p class="text {sizeClass}">{shown.text}</p>

  {#if shown.speak && !isSoft}
    <aside class="speak">
      <div class="speak-label"><Icon name="truth" size={13} /> say this while it happens</div>
      <p>{shown.speak}</p>
    </aside>
  {/if}

  {#if safeword && shown.level === 4 && !isSoft}
    <div class="safeword">safe word <strong>{safeword}</strong> — say it anytime, no questions</div>
  {/if}

  {#if total > 0}
    <div class="timer" class:done={remaining === 0} class:urgent={remaining <= 10 && remaining > 0} style={ringStyle}>
      <div class="timer-inner">
        {#if remaining === 0}
          <span>take your time anyway</span>
        {:else}
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
        {/if}
      </div>
    </div>
  {/if}

  {#if !landing && !isSoft}
    <div class="swipe-tip dim">swipe for next · swipe back to skip</div>
  {/if}
</div>

<style>
  .card {
    position: relative;
    width: min(92vw, 68vmin);
    overflow: hidden;
    touch-action: none;
    padding: clamp(22px, 4vmin, 44px) clamp(20px, 3.6vmin, 40px);
    border-radius: var(--r-lg);
    display: flex;
    flex-direction: column;
    gap: clamp(14px, 2.4vmin, 26px);
    text-align: center;
    align-items: center;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
      var(--glass-strong);
    border: 1px solid var(--edge);
    backdrop-filter: blur(28px) saturate(140%);
    -webkit-backdrop-filter: blur(28px) saturate(140%);
    box-shadow: var(--shadow-card);
    scrollbar-width: thin;
    transition: transform 0.3s var(--spring), opacity 0.3s ease, box-shadow 0.4s ease;
  }
  .card.flying { transition: transform 0.22s ease-in, opacity 0.22s ease-in; }
  .hairline {
    position: absolute;
    top: 0; left: 24px; right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--p1) 20%, var(--ember) 50%, var(--p2) 80%, transparent);
    opacity: 0.7;
  }
  .card.bomb .hairline { background: linear-gradient(90deg, transparent, var(--ember-soft), var(--p2), transparent); opacity: 0.9; }

  .swipe-hint {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    padding: 10px 22px;
    border-radius: var(--r-pill);
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 0.18em;
    z-index: 3;
  }
  .swipe-hint.next { right: 16px; color: var(--good); border: 1.5px solid var(--good); background: rgba(126, 201, 138, 0.12); }
  .swipe-hint.skip { left: 16px; color: var(--p2); border: 1.5px solid var(--p2); background: rgba(255, 82, 115, 0.12); }

  .badge-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 13px;
    border-radius: var(--r-pill);
    font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
  }
  .badge-badge { color: #ffd9a0; background: linear-gradient(135deg, #b3451f, #8f1d3a); box-shadow: 0 8px 24px rgba(179, 69, 31, 0.45); }
  .badge-badge.landing { background: linear-gradient(135deg, #5a4a7a, #8f1d3a); color: #efe6ff; }

  .meta { display: flex; align-items: center; gap: 12px; color: var(--ink-dim); }
  .type {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: clamp(11px, 1.5vmin, 13px); font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
  }
  .card.bomb .type { color: var(--ember-soft); }
  .dots { display: inline-flex; gap: 4px; }
  .dots i { width: 5px; height: 5px; border-radius: 50%; background: rgba(255, 255, 255, 0.18); }
  .dots i.on { background: currentColor; box-shadow: 0 0 6px currentColor; }

  .text {
    font-family: var(--font-display);
    font-variation-settings: 'SOFT' 55, 'WONK' 1, 'opsz' 72;
    font-weight: 580;
    letter-spacing: -0.01em;
    line-height: 1.16;
    text-wrap: pretty;
    overflow-wrap: break-word;
  }
  .text.xl { font-size: clamp(27px, 6.4vmin, 66px); }
  .text.lg { font-size: clamp(25px, 5.4vmin, 54px); }
  .text.md { font-size: clamp(22px, 4.6vmin, 44px); line-height: 1.22; }
  .text.sm { font-size: clamp(20px, 4vmin, 36px); line-height: 1.3; }
  .text.xs { font-size: clamp(19px, 3.6vmin, 32px); line-height: 1.34; }

  .speak {
    width: 100%;
    padding: clamp(12px, 2vmin, 18px) clamp(14px, 2.4vmin, 22px);
    border-radius: var(--r-sm);
    background: rgba(255, 179, 92, 0.07);
    border-left: 2px solid var(--ember-soft);
    text-align: left;
  }
  .speak-label {
    display: flex; align-items: center; gap: 6px;
    font-size: clamp(10px, 1.3vmin, 12px); font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--ember-soft); margin-bottom: 7px;
  }
  .speak p {
    font-family: var(--font-display);
    font-variation-settings: 'SOFT' 60, 'opsz' 30;
    font-size: clamp(16px, 2.5vmin, 25px);
    font-weight: 480;
    font-style: italic;
    line-height: 1.4;
    color: var(--ink);
  }

  .safeword {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center;
    font-size: clamp(11px, 1.4vmin, 13px); color: var(--ink-dim);
  }
  .safeword strong { color: var(--ember-soft); letter-spacing: 0.1em; text-transform: uppercase; }

  .timer {
    width: clamp(78px, 13vmin, 120px);
    aspect-ratio: 1;
    border-radius: 50%;
    display: grid; place-items: center;
    color: var(--ember-soft);
    padding: 4px;
    flex: none;
  }
  .timer.done { color: var(--ink-dim); }
  .timer.urgent { animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 50% { filter: brightness(1.5); } }
  .timer-inner {
    width: 100%; height: 100%; border-radius: 50%;
    background: rgba(14, 10, 18, 0.94);
    display: grid; place-items: center;
    font-variant-numeric: tabular-nums; font-weight: 600;
    font-size: clamp(14px, 2.5vmin, 23px);
    padding: 6px; text-align: center;
  }

  .swipe-tip { font-size: clamp(10px, 1.4vmin, 12px); letter-spacing: 0.06em; }

  /* ---- deal-in stagger: badge leads, then meta → text → speak → timer ---- */
  @keyframes deal-reveal {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
  .deal .meta,
  .deal .text,
  .deal .speak,
  .deal .timer,
  .deal .safeword {
    animation: deal-reveal 260ms var(--spring) both;
  }
  .deal .meta { animation-delay: 40ms; }
  .deal .text { animation-delay: 80ms; }
  .deal .speak { animation-delay: 120ms; }
  .deal .timer { animation-delay: 160ms; }
  .deal .safeword { animation-delay: 160ms; }

  /* ---- heat styling: level-4 / spice bomb ---- */
  .card.bomb {
    background:
      linear-gradient(180deg, rgba(255, 122, 61, 0.10), rgba(255, 82, 115, 0.06)),
      var(--glass-strong);
    border-color: rgba(255, 122, 61, 0.35);
    box-shadow: var(--shadow-card), 0 0 44px rgba(255, 122, 61, 0.10);
  }
  .card.bomb::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(700px circle at 50% 28%, rgba(255, 122, 61, 0.07), transparent 48%);
    pointer-events: none;
  }
  .card.bomb .hairline { opacity: 1; }
  .card.bomb .dots { color: var(--ember-soft); }
  .card.l4 {
    border-color: rgba(255, 122, 61, 0.3);
    box-shadow: var(--shadow-card), 0 0 24px rgba(255, 122, 61, 0.06);
  }

  /* ---- speak block: "whisper" ---- */
  .speak {
    background: rgba(255, 179, 92, 0.04);
    border-left: 2px solid var(--ember);
    box-shadow: inset 3px 0 0 rgba(255, 122, 61, 0.35);
  }
  .speak-label {
    font-size: clamp(9px, 1.2vmin, 11px);
    letter-spacing: 0.22em;
    color: var(--ink-dim);
  }
  .speak p {
    font-size: clamp(18px, 3.2vmin, 30px);
    font-weight: 450;
    color: var(--ink);
  }

  /* ---- timer ring polish ---- */
  .timer.urgent {
    color: var(--ember-soft);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { filter: brightness(1); color: var(--ember-soft); }
    50% { filter: brightness(1.35); color: var(--p2); }
  }
  .timer.done {
    color: var(--ink-dim);
    opacity: 0.9;
    animation: none;
    box-shadow: inset 0 0 14px rgba(0, 0, 0, 0.35);
  }
</style>
