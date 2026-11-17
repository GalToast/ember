<script lang="ts">
  // Ember icon set — hand-drawn quality, currentColor, no emoji ever.
  // Each icon has a slightly organic, "ink on paper" feel — not geometric-perfect.
  export type IconName =
    | 'truth' | 'dare' | 'challenge' | 'ice' | 'topic'
    | 'bomb' | 'flame' | 'timer' | 'pass' | 'skip' | 'soften' | 'end' | 'expand' | 'heart' | 'warning' | 'ban';
  let { name, size = 20 }: { name: IconName; size?: number } = $props();

  // Refined paths: slightly organic, more distinctive, with personality.
  // The "eccentric designer" touch: perfect symmetry is mechanical; these have character.
  const paths: Record<IconName, string> = {
    // TRUTH — speech bubble with a small sparkle inside (truth has a light)
    truth: 'M12 19c4.2.1 7.8-2.4 7.9-6.2.1-3.9-3.4-6.9-7.9-6.8-4.4.1-7.8 3-7.9 6.7-.1 1.7.6 3.2 1.8 4.2L5.5 20.5l3.4-1.7c1 .4 2.1.6 3.1.5ZM9.5 12l1.8 1.5 3.4-3.6',

    // DARE — lightning with a slight curve (energy, not geometry)
    dare: 'M13.5 2.5C11 6 8.5 8 5.5 12.5H10l-1 9c2.5-3.5 5-5.5 8-10l-4.5.5 1-9.5Z',

    // CHALLENGE — opposing arrows with a link in the middle (two sides, one bond)
    challenge: 'M7.5 3.5 3.5 8l4 4.5M3.5 8h9M16.5 20.5l4-4.5-4-4.5M20.5 16h-9M9 12h6m-6 0 1.5-1.5M15 12l-1.5 1.5',

    // ICE — starburst with slightly organic rays (light, airy, hand-drawn)
    ice: 'M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5M5.3 5.3l3.5 3.5M15.2 15.2l3.5 3.5M5.3 18.7l3.5-3.5M15.2 8.8l3.5-3.5',

    // TOPIC — thought balloon with more distinct thought dots (conversation, flow)
    topic: 'M21 11.5a8 8 0 1 0-3.1 6.3L21 19.5l-.6-3.2a7.9 7.9 0 0 0 .6-4.8ZM8.5 12h.01m3.5 0h.01m3.5 0h.01',

    // BOMB — classic round bomb with a lit fuse (danger, spice)
    bomb: 'M14.5 8.5a6 6 0 1 1-4.2 10.3M14.5 8.5l2.2-2.2m-2.2 2.2a6 6 0 0 0-2.2-.4M16.8 4.8l1.5-1.5M16.8 4.8l1.5 1.5M16.8 4.8l-1.5-1.5M5.5 5.5l.01.01M7.5 3.5l.01.01',

    // FLAME — organic flame with a curl (warmth, passion)
    flame: 'M12.5 2.5c.8 3-2.8 4.5-2.8 8.2a2.8 2.8 0 0 0 5.6.2c.2-2.8 2.8-1.8 2.3 1.8a5.5 5.5 0 0 1-11 0c-.6-4.5 3.9-6 5.9-10.2Z',

    // TIMER — clock with a slight lean (time is organic)
    timer: 'M12 8.5v4.5l3 1.8M12 21a8 8 0 1 0 .1-16A8 8 0 0 0 12 21ZM9 2.5h6',

    // PASS — arrow right with a slight curve (forward motion)
    pass: 'M4.5 12.5h13.8m0 0-4.8-5m4.8 5-4.8 5',

    // SKIP — organic X (not perfect cross)
    skip: 'M6.5 6.5c3.7 3.7 7.3 7.3 11 11M17.5 6.5c-3.7 3.7-7.3 7.3-11 11',

    // BAN — slashed circle (never again, prohibition)
    ban: 'M7.5 3.5a8.5 8.5 0 1 0 .1 17 8.5 8.5 0 0 0-.1-17zM4.2 7.8l9.6 9.6',

    // SOFTEN — chevron down (yielding, cooling)
    soften: 'M4.5 9.5c2.5 2.5 5 5 7.5 7.5 2.5-2.5 5-5 7.5-7.5',

    // END — power symbol (shutdown, ending)
    end: 'M12 3.5v8.5M6.3 6.3a8 8 0 1 0 11.4 0',

    // EXPAND — fullscreen corners (TV, projection)
    expand: 'M4.5 9V4.5H9M20 9V4.5h-4.5M4.5 15v4.5H9M20 15v4.5h-4.5',

    // HEART — organic heart (the mute-on quirk: sound = heart, deliberately)
    heart: 'M12 20.5C7 16.5 3.5 13 3.5 9.4 3.5 6.9 5.4 5 7.9 5c1.6 0 3.1.9 4.1 2.3C13 5.9 14.5 5 16.1 5c2.5 0 4.4 1.9 4.4 4.4 0 3.6-3.5 7.1-8.5 11.1Z',

    // WARNING — triangle with a slight lean (caution, alert)
    warning: 'M12 9.5v3.5m0 3.5v.01M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z',
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={paths[name]} />
</svg>

<style>
  svg { display: inline-block; vertical-align: -0.2em; flex: none; }
</style>