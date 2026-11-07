<script lang="ts">
  import Mesh from './components/Mesh.svelte';
  import Setup from './components/Setup.svelte';
  import Splash from './components/Splash.svelte';
  import CardView from './components/Card.svelte';
  import Celebration from './components/Celebration.svelte';
  import Icon from './components/Icon.svelte';
  import { draw, load, save, type Mode, MODES } from './lib/game.svelte';
  import type { Card } from './lib/schema';

  const persisted = $state(load());
  let names = $state(persisted.names);
  let mode = $state<Mode>('mixup');
  let screen = $state<'setup' | 'splash' | 'play' | 'celebrate'>('setup');
  let card = $state<Card | null>(null);
  let soft = $state(false);
  let skips = $state(6);
  let count = $state(0);
  let wakeLock: { release: () => Promise<void> } | null = null;

  async function lockScreen() {
    try {
      wakeLock = (await navigator.wakeLock.request('screen')) as typeof wakeLock;
    } catch { /* best effort */ }
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

  function next() {
    const c = draw(mode, card ?? undefined);
    if (!c) { end(); return; }
    card = c;
    soft = false;
    count += 1;
    screen = 'play';
  }

  function skip() {
    if (skips <= 0) return;
    skips -= 1;
    next();
  }

  function end() {
    save({ names, nights: [...persisted.nights, { date: new Date().toISOString().slice(0, 10), cards: count, mode }] });
    persisted.nights = load().nights;
    unlockScreen();
    screen = 'celebrate';
  }

  function home() {
    unlockScreen();
    screen = 'setup';
    card = null;
    count = 0;
    skips = 6;
  }
</script>

<Mesh />

{#if screen === 'setup'}
  <Setup bind:names bind:mode onStart={() => (screen = 'splash')} />
{:else if screen === 'splash'}
  <Splash onBegin={() => { lockScreen(); next(); }} />
{:else if screen === 'play' && card}
  <main class="stage" data-testid="stage">
    <div class="topbar">
      <span class="modetag">{MODES.find((m) => m.id === mode)?.name}</span>
      <span class="skips" data-testid="skips" title="skips left">
        {#each Array(skips) as _}<i></i>{/each}
      </span>
      <button class="icon-btn" onclick={goFullscreen} title="fullscreen for the TV"><Icon name="expand" /></button>
    </div>

    <div class="cardzone">
      {#key card.id}
        <CardView {card} playerColor="p1" {soft} />
      {/key}
    </div>

    <nav class="dock glass" data-testid="dock">
      <button class="btn btn-ghost" onclick={() => (soft = !soft)} disabled={!card.soften} title="show the softer variant">
        <Icon name="soften" /> {soft ? 'Back up' : 'Soften'}
      </button>
      <button class="btn btn-ghost" onclick={skip} disabled={skips <= 0} data-testid="skip">
        <Icon name="skip" /> Skip
      </button>
      <button class="btn btn-primary" onclick={next} data-testid="next">
        Next <Icon name="pass" />
      </button>
      <button class="icon-btn end" onclick={end} title="end the night warm"><Icon name="end" /></button>
    </nav>
  </main>
{:else if screen === 'celebrate'}
  <Celebration cards={count} nights={persisted.nights.length} onAgain={next} onHome={home} />
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
  .topbar {
    display: flex;
    align-items: center;
    gap: 14px;
  }
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

  .cardzone {
    flex: 1;
    display: grid;
    place-items: center;
    min-height: 0;
  }

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
</style>
