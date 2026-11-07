<script lang="ts">
  // Ember custom icon set — thin geometric strokes, currentColor, no emoji ever.
  export type IconName =
    | 'truth' | 'dare' | 'challenge' | 'ice' | 'topic'
    | 'bomb' | 'flame' | 'timer' | 'pass' | 'skip' | 'soften' | 'end' | 'expand' | 'heart' | 'warning';
  let { name, size = 20 }: { name: IconName; size?: number } = $props();

  const paths: Record<IconName, string> = {
    truth: 'M12 19c4 0 8-2.5 8-6.5S16 6 12 6 4 8.5 4 12.5c0 1.6.8 3 2 4.1L5.5 20l3.2-1.6c1 .4 2.1.6 3.3.6Z', // speech bubble
    dare: 'M13 2 5 13h5l-1 9 8-11h-5l1-9Z', // bolt
    challenge: 'M8 3 3 8l5 5M3 8h11M16 21l5-5-5-5M21 16H10', // opposing arrows
    ice: 'M12 3v18M3 12h18M6 6l12 12M18 6 6 18', // starburst
    topic: 'M21 12a8 8 0 1 0-3.1 6.3L21 19l-.6-3.2A7.9 7.9 0 0 0 21 12Z', // thought balloon
    bomb: 'M14 8a6 6 0 1 1-4 10.9M14 8l2-2m-2 2a6 6 0 0 0-2-.4M16.5 4.5 18 3m-1.5 1.5 1.5 1.5-1.5-1.5ZM5 5l.01.01M7 3l.01.01', // bomb + fuse sparkle
    flame: 'M12 3c1 3-3 4.5-3 8a3 3 0 0 0 6 .2C15 8 18 9.5 17.5 13A5.5 5.5 0 0 1 6.6 12C6 7.5 10.5 6 12 3Z', // flame
    timer: 'M12 8v5l3 2M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9 2h6', // clock
    pass: 'M5 12h13m0 0-5-5m5 5-5 5', // arrow right
    skip: 'M6 6l12 12M18 6 6 18', // cross
    soften: 'M4 9l8 8 8-8', // chevron down
    end: 'M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0', // power
    expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', // fullscreen corners
    heart: 'M12 20.5C7 16.5 3.5 13 3.5 9.4 3.5 6.9 5.4 5 7.9 5c1.6 0 3.1.9 4.1 2.3C13 5.9 14.5 5 16.1 5c2.5 0 4.4 1.9 4.4 4.4 0 3.6-3.5 7.1-8.5 11.1Z', // heart
    warning: 'M12 9v4m0 3.5v.01M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z', // triangle
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={paths[name]} />
</svg>

<style>
  svg { display: inline-block; vertical-align: -0.2em; flex: none; }
</style>
