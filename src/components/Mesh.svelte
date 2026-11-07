<script lang="ts">
  // animated aurora mesh — the 2030 floor. Blue + red orbs drifting, meeting in ember light.
  let hue1 = Math.random() * 360;
  let hue2 = Math.random() * 360;
  setInterval(() => {
    hue1 = (hue1 + 137) % 360;
    hue2 = (hue2 + 89) % 360;
  }, 9000);
</script>

<div class="mesh" aria-hidden="true">
  <div class="orb blue" style="--h:{hue1}"></div>
  <div class="orb red" style="--h:{hue2}"></div>
  <div class="grain"></div>
</div>

<style>
  .mesh {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
  }
  .orb {
    position: absolute;
    width: 90vmax;
    height: 90vmax;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.5;
    will-change: transform;
  }
  .blue {
    background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--p1) 55%, transparent), transparent 65%);
    top: -35vmax;
    left: -25vmax;
    animation: drift1 26s ease-in-out infinite alternate;
  }
  .red {
    background: radial-gradient(circle at 60% 60%, color-mix(in srgb, var(--p2) 50%, transparent), transparent 65%);
    bottom: -40vmax;
    right: -30vmax;
    animation: drift2 31s ease-in-out infinite alternate;
  }
  @keyframes drift1 {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(14vmax, 10vmax) scale(1.15); }
  }
  @keyframes drift2 {
    from { transform: translate(0, 0) scale(1.1); }
    to { transform: translate(-12vmax, -8vmax) scale(0.95); }
  }
  .grain {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E");
  }
</style>
