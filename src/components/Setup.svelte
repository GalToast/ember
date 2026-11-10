<script lang="ts">
  import Icon from './Icon.svelte';
  import { MODES, type Mode, ALL_DECKS, DECKS, type DeckId } from '../lib/game.svelte';

  let {
    names = $bindable(),
    mode = $bindable(),
    decks = $bindable(),
    safeword = $bindable(),
    setMode,
    toggleDeck,
    resumeLabel = '',
    onResume,
    onRestart,
    onStart,
    onBrowse,
    onPtp,
    onCustom,
  }: {
    names: { a: string; b: string };
    mode: Mode;
    decks: DeckId[];
    safeword: string;
    setMode: (m: Mode) => void;
    toggleDeck: (id: DeckId) => void;
    resumeLabel?: string;
    onResume: () => void;
    onRestart: () => void;
    onStart: () => void;
    onBrowse?: () => void;
    onPtp?: () => void;
    onCustom?: () => void;
  } = $props();

  let warn = $state(false);
  // UX-1 (audit 2026-11-10): on Inferno select, the inline warning mounts below the fold —
  // bring it into view so the state change is visible feedback, not a silent no-op.
  function warnReveal(node: HTMLElement) {
    node.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  const canStart = $derived(names.a.trim().length > 0 && names.b.trim().length > 0 && decks.length > 0);
  const deckCards = (id: DeckId) => DECKS[id]?.cards.length ?? 0;
</script>

<div class="wrap enter">
  <header>
    <div class="brand" aria-label="Ember"><Icon name="heart" size={24} /> Ember</div>
    <h1 class="display">Played best <em>tangled up</em> together.</h1>
    <p class="dim">Cuddle in, get comfortable — the phone is the only thing allowed between you tonight.</p>
  </header>

  {#if resumeLabel}
    <button class="resume" onclick={onResume}>
      <Icon name="pass" size={15} /> {resumeLabel}
    </button>
  {/if}

  <section class="names">
    <label class="n1"><span class="dot p1"></span><input type="text" class="p1" placeholder="First name" maxlength="14" bind:value={names.a} /></label>
    <div class="amp display">&</div>
    <label class="n2"><input type="text" class="p2" placeholder="First name" maxlength="14" bind:value={names.b} /><span class="dot p2"></span></label>
  </section>

  <section class="modes" data-testid="modes">
    {#each MODES as m (m.id)}
      <button class="mode" class:on={mode === m.id} onclick={() => { setMode(m.id); warn = m.id === 'inferno'; }}>
        <span class="m-name">{m.name}</span>
        <span class="m-blurb dim">{m.blurb}</span>
      </button>
    {/each}
  </section>

  <section class="decks" data-testid="decks">
    {#each ALL_DECKS as id (id)}
      <button class="dchip" class:on={decks.includes(id)} class:off={!decks.includes(id)} class:adult={DECKS[id]?.adult} onclick={() => toggleDeck(id)}>
        {DECKS[id]?.name}<span class="count dim">{deckCards(id)}</span>
      </button>
    {/each}
  </section>

  {#if warn}
    <!-- UX-1 (audit 2026-11-10): the warning rendered below the fold, so tapping Inferno
         looked like the tap did nothing. Scroll it into view when it mounts. -->
    <div class="warning pop" data-testid="inferno-warning" use={warnReveal}>
      <Icon name="warning" size={20} />
      <div>
        <strong>Inferno is all spice bombs — the whole deck, extreme, no gates past this point.</strong>
        <span class="dim">Pick a safe word (optional). Skip is always free and always shameless.</span>
        <input type="text" placeholder="safe word — optional" maxlength="20" bind:value={safeword} />
      </div>
      <button class="btn btn-primary" onclick={onStart} disabled={!canStart}>Light it</button>
    </div>
  {:else}
    <button class="btn btn-primary start" onclick={onStart} disabled={!canStart} data-testid="start">
      Start the night
    </button>
  {/if}
  <button class="browse-btn" onclick={onBrowse} data-testid="browse-open" title="flip through any deck without starting a night">
    <Icon name="truth" size={15} /> Browse the decks first
  </button>
  <button class="browse-btn" onclick={onPtp} data-testid="ptp-open" title="pass-the-phone: private cards each player reads alone">
    <Icon name="skip" size={15} /> Pass-the-phone night
  </button>
  <button class="browse-btn" onclick={onCustom} data-testid="custom-open" title="write your own cards — dealt into every mode">
    <Icon name="heart" size={15} /> Write your own card
  </button>
</div>

<style>
  .wrap {
    flex: 1;
    display: flex; flex-direction: column; justify-content: safe center; align-items: center;
    gap: clamp(14px, 2.6vmin, 26px);
    /* S23 play-test defect 1 (2026-11-10), CORRECTED 07:1xZ. Two attempts, only one works:
       (1) env(safe-area-inset-top) does NOT help here — MainActivity sets
           SYSTEM_UI_FLAG_FULLSCREEN, which hides the status bar entirely, so the inset
           resolves to 0 and max(clamp(16px,3vmin,40px), 0) is byte-identical padding.
       (2) The real cause: this column's content is TALLER than the viewport, and
           `justify-content: center` centres an OVERFLOWING flex box — which pushes the
           first row above the scroll origin, so it is unreachable by scrolling, not merely
           hidden. `safe center` is the spec-correct answer: centre when the content fits,
           fall back to start alignment when it overflows. Keeps the desktop look, fixes the APK.
       Regression test: uiautomator dump -> the h1 bounds top must be > 0. */
    padding: max(clamp(16px, 3vmin, 40px), env(safe-area-inset-top)) clamp(16px, 3vmin, 40px) max(clamp(16px, 3vmin, 40px), env(safe-area-inset-bottom));
    z-index: 1; overflow-y: auto;
  }
  header { text-align: center; max-width: 640px; display: flex; flex-direction: column; gap: 12px; }
  .brand {
    display: inline-flex; align-items: center; gap: 9px; justify-content: center;
    font-family: var(--font-ui);
    font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; font-size: 12px; color: var(--ember-soft);
  }
  h1 { font-size: clamp(30px, 6vmin, 58px); }
  h1 em {
    font-style: italic;
    font-variation-settings: 'SOFT' 80, 'WONK' 1;
    background: linear-gradient(120deg, var(--p1) 10%, var(--p2) 90%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  header p { font-size: clamp(14px, 1.9vmin, 17px); line-height: 1.55; max-width: 42ch; margin-inline: auto; }

  .resume {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px; border-radius: var(--r-pill);
    background: rgba(126, 201, 138, 0.1); border: 1px solid rgba(126, 201, 138, 0.4);
    color: var(--good); font-weight: 600; font-size: clamp(13px, 1.8vmin, 15px);
  }

  .names { display: flex; align-items: center; gap: clamp(8px, 1.6vmin, 16px); width: min(92vw, 500px); }
  .names label { flex: 1; display: flex; align-items: center; gap: 10px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; box-shadow: 0 0 12px currentColor; }
  .dot.p1 { background: var(--p1); color: var(--p1); }
  .dot.p2 { background: var(--p2); color: var(--p2); }
  .amp { font-family: var(--font-display); font-size: clamp(22px, 3.4vmin, 34px); color: var(--ink-dim); }

  .modes { display: grid; grid-template-columns: repeat(2, minmax(130px, 170px)); gap: 8px; width: min(92vw, 480px); }
  .mode {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
    padding: 12px 16px; border-radius: var(--r-sm);
    background: var(--glass); border: 1px solid var(--edge);
    text-align: left; min-height: 58px;
    transition: all 0.25s var(--spring);
  }
  .mode:active { transform: scale(0.97); }
  .mode:focus-visible { outline: 2px solid var(--ember-soft); outline-offset: 2px; }
  .mode.on {
    background: linear-gradient(135deg, rgba(255, 122, 61, 0.2), rgba(255, 82, 115, 0.18));
    border-color: var(--ember);
    box-shadow: 0 0 28px rgba(255, 122, 61, 0.18);
  }
  .mode.on .m-name { color: var(--ink); }
  .mode.on .m-blurb { color: var(--ink-dim); }
  .m-name { font-weight: 700; font-size: clamp(14px, 1.9vmin, 16px); letter-spacing: 0.02em; }
  .m-blurb { font-size: clamp(11px, 1.5vmin, 12.5px); line-height: 1.3; }

  /* S23 play-test defect 2 (2026-11-10): the wrapping flex row landed 3/2/1 at density
     480 and left 'Inferno 200' alone + dimmed on its own line, reading as DISABLED.
     Fixed grid: 2 columns on every phone width (6 decks = clean 3 rows), desktop keeps
     the roomy auto layout. The dimmed state now also keeps an explicit disabled style so
     .off never looks like a rendering accident. */
  .decks { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; max-width: 92vw; }
  @media (max-width: 560px) {
    .decks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: min(92vw, 420px); }
    .dchip { justify-content: center; width: 100%; }
  }
  .dchip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: var(--r-pill); min-height: 36px; font-size: clamp(11px, 1.5vmin, 13px);
    font-weight: 600;
    background: var(--glass); border: 1px solid var(--edge); color: var(--ink);
    transition: all 0.2s var(--spring);
  }
  .dchip:active { transform: scale(0.96); }
  .dchip:focus-visible { outline: 2px solid var(--ember-soft); outline-offset: 2px; }
  .dchip .count { font-size: 11px; font-weight: 400; }
  /* S23 play-test defect 2b (2026-11-10): `.off` used to be opacity:0.3, which reads as
     DISABLED/AVAILABLE-NO rather than DESELECTED. Measured on device: the Inferno chip had
     enabled=true, clickable=true, checked=false - it was fully tappable, just not selected,
     and it looked broken next to five orange neighbours. A toggle must look unselected, not
     unavailable: dim the SURFACE only, keep the label at full contrast and the border intact. */
  .dchip.off {
    background: rgba(255, 255, 255, 0.02);
    border-color: var(--edge);
    color: var(--ink-dim);
    opacity: 1;
  }
  .dchip.off .count { opacity: 0.75; }
  .dchip.on {
    background: linear-gradient(135deg, rgba(255, 122, 61, 0.22), rgba(255, 82, 115, 0.22));
    border-color: var(--ember);
    color: var(--ink);
    box-shadow: 0 0 20px rgba(255, 122, 61, 0.18);
  }
  .dchip.adult:not(.off) { border-color: rgba(255, 82, 115, 0.45); }
  .dchip.adult.on { border-color: var(--ember); box-shadow: 0 0 20px rgba(255, 82, 115, 0.2); }

  .warning {
    width: min(92vw, 560px);
    display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-radius: var(--r-md);
    background: linear-gradient(135deg, rgba(179, 69, 31, 0.24), rgba(143, 29, 58, 0.24));
    border: 1px solid rgba(255, 122, 61, 0.55);
    box-shadow: 0 0 30px rgba(179, 69, 31, 0.14), inset 0 1px 0 rgba(255, 122, 61, 0.3); flex-wrap: wrap;
  }
  .warning > :global(svg) { color: var(--ember-soft); flex: none; }
  .warning div { flex: 1; display: flex; flex-direction: column; gap: 8px; font-size: clamp(13px, 1.7vmin, 15px); }
  .warning strong { color: var(--ember-soft); }
  .warning input { min-height: 44px; padding: 10px 14px; font-size: 15px; }
  .warning .btn { min-height: 48px; padding: 10px 22px; }
  .start { font-size: clamp(17px, 2.4vmin, 22px); padding: 17px 42px; }
  .browse-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: var(--r-pill);
    background: var(--glass); border: 1px solid var(--edge); color: var(--ink-dim);
    font-size: clamp(13px, 1.8vmin, 15px); font-weight: 700;
    transition: all 0.2s var(--spring);
  }
  .browse-btn:active { transform: scale(0.96); }
  .browse-btn:hover { color: var(--ink); border-color: var(--edge-strong); }
</style>
