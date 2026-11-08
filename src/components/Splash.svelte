<script lang="ts">
  import Icon from './Icon.svelte';
  let { onBegin }: { onBegin: () => void } = $props();
</script>

<div class="wrap pop">
  <div class="glass splash">
    <Icon name="heart" size={44} />
    <h2 class="display">Get close.</h2>
    <p>
      This game is played in close contact — ideally <em>cuddled or spooned</em>.
      The phone is the deck; the TV is the stage; the two of you are the whole point.
      Every card is an invitation. Skipping is always free. Ending warm is the only rule.
    </p>
    <button class="btn btn-primary" onclick={onBegin} data-testid="begin">We're ready</button>
  </div>
</div>

<style>
  .wrap {
    flex: 1;
    display: grid;
    place-items: center;
    padding: clamp(20px, 4vmin, 48px);
    z-index: 1;
  }
  .splash {
    width: min(92vw, 640px);
    padding: clamp(28px, 5vmin, 56px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(14px, 2.6vmin, 24px);
    text-align: center;
  }
  .splash > :global(svg) { color: var(--ember); filter: drop-shadow(0 0 18px rgba(255, 122, 61, 0.5)); animation: breathe 7s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  h2 { font-size: clamp(30px, 6vmin, 56px); }
  p {
    font-size: clamp(16px, 2.3vmin, 22px);
    line-height: 1.55;
    color: var(--ink-dim);
    max-width: 46ch;
    text-wrap: balance;
  }
  p em { color: var(--ember-soft); font-style: normal; font-weight: 700; }

  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 14px 44px rgba(255, 82, 115, 0.45); }
  .btn-primary:active { transform: scale(0.96); }
</style>
