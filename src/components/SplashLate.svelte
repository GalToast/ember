<!-- UX-8 (audit 2026-11-10): the return-night splash. Night 1 gets the full 'Get close.'
     moment; later nights get a two-second breath instead — same tone, no demand. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  let { onBegin = () => {} }: { onBegin?: () => void } = $props();
  let ready = $state(false);
  onMount(() => {
    const t = setTimeout(() => { ready = true; }, 2200);
    return () => clearTimeout(t);
  });
  // advance on any tap too — the timer is a breath, not a gate
  function tap() { if (ready || true) onBegin(); }
</script>

<button class="late" onclick={tap} aria-label="Begin the night" data-testid="begin-late">
  <div class="glyph"><Icon name="heart" size={30} /></div>
  <p class="line">Welcome back. Cuddle in.</p>
  <p class="hint dim">tap anywhere to begin</p>
</button>

<style>
  .late {
    width: 100%; height: 100svh;
    display: grid; place-content: center; justify-items: center; gap: 14px;
    background: transparent; border: none; cursor: pointer;
  }
  .glyph { color: var(--ember); opacity: 0.9; animation: pulse 2.2s ease-in-out; }
  .line { font-size: clamp(17px, 2.4vmin, 21px); color: var(--ink); margin: 0; }
  .hint { font-size: 13px; margin: 0; }
  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.4; }
    60% { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
  }
</style>
