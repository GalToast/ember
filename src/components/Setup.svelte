<script lang="ts">
  import Icon from './Icon.svelte';
  import { MODES, type Mode } from '../lib/game.svelte';

  let { names = $bindable(), mode = $bindable(), onStart }: { names: { a: string; b: string }; mode: Mode; onStart: () => void } = $props();

  let warn = $state(false);
  const canStart = $derived(names.a.trim().length > 0 && names.b.trim().length > 0);

  function pick(m: Mode) {
    mode = m;
    warn = m === 'inferno';
  }
</script>

<div class="wrap enter">
  <header>
    <div class="brand"><Icon name="heart" size={26} /> Ember</div>
    <h1 class="display">Played best <em>tangled up</em> together.</h1>
    <p class="dim">Cuddle in, get comfortable — the phone is the only thing allowed between you tonight. One of you holds it; you both play.</p>
  </header>

  <section class="names">
    <label class="n1">
      <span class="dot p1"></span>
      <input type="text" class="p1" placeholder="First name" maxlength="14" bind:value={names.a} />
    </label>
    <div class="amp display">&</div>
    <label class="n2">
      <input type="text" class="p2" placeholder="First name" maxlength="14" bind:value={names.b} />
      <span class="dot p2"></span>
    </label>
  </section>

  <section class="modes" data-testid="modes">
    {#each MODES as m (m.id)}
      <button class="chip" class:on={mode === m.id} onclick={() => pick(m.id)}>{m.name}</button>
    {/each}
  </section>
  <p class="blurb dim">{MODES.find((m) => m.id === mode)?.blurb}</p>

  {#if warn}
    <div class="warning pop" data-testid="inferno-warning">
      <Icon name="warning" size={20} />
      <div>
        <strong>Inferno is all spice bombs — the whole deck, extreme, no gates past this point.</strong>
        <span class="dim">Skip is always free and always shameless. If that's the night you're both up for, light it.</span>
      </div>
      <button class="btn btn-primary" onclick={onStart} disabled={!canStart}>Light it</button>
    </div>
  {:else}
    <button class="btn btn-primary start" onclick={onStart} disabled={!canStart} data-testid="start">
      Start the night
    </button>
  {/if}
</div>

<style>
  .wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: clamp(18px, 3.4vmin, 34px);
    padding: clamp(20px, 4vmin, 48px);
    z-index: 1;
    overflow-y: auto;
  }
  header {
    text-align: center;
    max-width: 620px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-size: 13px;
    color: var(--ember-soft);
  }
  h1 {
    font-size: clamp(30px, 6vmin, 58px);
  }
  h1 em {
    font-style: normal;
    background: linear-gradient(120deg, var(--p1), var(--p2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  header p { font-size: clamp(14px, 1.9vmin, 17px); line-height: 1.5; }

  .names {
    display: flex;
    align-items: center;
    gap: clamp(8px, 1.6vmin, 16px);
    width: min(92vw, 520px);
  }
  .names label { flex: 1; display: flex; align-items: center; gap: 10px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; box-shadow: 0 0 12px currentColor; }
  .dot.p1 { background: var(--p1); color: var(--p1); }
  .dot.p2 { background: var(--p2); color: var(--p2); }
  .amp { font-size: clamp(22px, 3.4vmin, 34px); color: var(--ink-dim); }

  .modes { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .blurb { min-height: 1.4em; font-size: clamp(13px, 1.7vmin, 16px); }

  .warning {
    width: min(92vw, 560px);
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(179, 69, 31, 0.18), rgba(143, 29, 58, 0.18));
    border: 1px solid rgba(255, 122, 61, 0.4);
    flex-wrap: wrap;
  }
  .warning > :global(svg) { color: var(--ember-soft); flex: none; }
  .warning div { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: clamp(13px, 1.7vmin, 15px); }
  .warning strong { color: var(--ember-soft); }
  .warning .btn { min-height: 48px; padding: 10px 22px; }

  .start { font-size: clamp(17px, 2.4vmin, 22px); padding: 18px 44px; }
</style>
