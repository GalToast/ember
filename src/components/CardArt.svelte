<script lang="ts">
  /**
   * CardArt — the card's illustration band (step 5 / visual-ambition slice 1).
   *
   * WHAT THIS IS
   * A letterbox band (full card width, ~26-30% of the card height) that carries ONE large
   * version of the deck's motif, drawn on with a stroke animation when the card is dealt.
   *
   * WHY IT EXISTS
   * DeckWatermark already gives every deck a signature SVG motif, but at 0.04 opacity behind
   * the text - texture, not illustration. The owner's brief asked for "effort immediately
   * evident" and "complex designs" on a phone that can only spare a ~390x200 strip. This
   * promotes the existing motif into that strip: same paths, one focal gesture, drawn on deal.
   *
   * DETERMINISM (so 800 cards do not look like one card)
   * angle/flip/scale come from a stable hash of cardId - the same approach as ROLI's
   * seededUnit. Same card always looks the same, across reloads and devices, with no RNG.
   *
   * ACCESSIBILITY
   * aria-hidden: the art carries no meaning the card text does not. Under
   * prefers-reduced-motion the stroke is drawn instantly (no animation), never hidden.
   */
  import type { DeckId } from '../lib/schema';

  let { deck, cardId = '' }: { deck: DeckId; cardId?: string } = $props();

  // Same motif vocabulary as DeckWatermark (kept in sync deliberately - if you add a deck
  // motif there, add it here, or the band goes blank for that deck).
  const motifs: Record<DeckId, string> = {
    spark: 'M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8',
    closer: 'M8 12a4 4 0 1 1 8 0 4 4 0 1 1-8 0ZM12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8Z',
    slowburn: 'M12 3c1 3-2 4.5-2 8a2 2 0 0 0 4 .2C14 8 16 9.5 15.5 13A4.5 4.5 0 0 1 6.6 12C6 7.5 10 6 12 3Z',
    afterdark: 'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z',
    curious: 'M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.5.5-2 1-2 2.5M12 17v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    inferno: 'M12 3c0 3-3 4-3 7M12 3c0 3 3 4 3 7M6 21c0-6 6-8 6-14 0 6 6 8 6 14M3 16c2-3 4-4 6-5M21 16c-2-3-4-4-6-5',
  };

  // FNV-1a over the card id -> stable 32-bit int. Cheap, no deps, deterministic.
  function hash(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  const h = $derived(hash(cardId || deck));
  const angle = $derived((h % 9) - 4);              // -4..4 deg tilt
  const flip = $derived((h >> 4) % 2 === 1 ? -1 : 1);
  const scale = $derived(0.92 + (((h >> 8) % 10) / 100)); // 0.92..1.01
  const d = $derived(motifs[deck] ?? motifs.spark);
</script>

<div class="band" style="--angle: {angle}deg; --flip: {flip}; --scale: {scale}">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.9"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
</div>

<style>
  .band {
    flex: 0 0 auto;
    width: 100%;
    /* the letterbox budget: never more than a third of the card, never less than a hint */
    height: clamp(72px, 26%, 200px);
    display: grid;
    place-items: center;
    overflow: hidden;
    color: color-mix(in srgb, var(--spot, #e8b44c) 55%, transparent);
    /* the band sits on the same warm cavity the keybed uses, so the motif reads as
       lit from the card rather than pasted on it */
    background: radial-gradient(ellipse at 50% 120%, rgba(232, 180, 76, 0.10), transparent 62%);
    border-radius: 6px;
    mask-image: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent);
    -webkit-mask-image: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent);
  }
  .band svg {
    width: min(58%, 210px);
    height: auto;
    transform: scaleX(var(--flip, 1)) rotate(var(--angle, 0deg)) scale(var(--scale, 1));
    opacity: 0.9;
  }
  /* draw-on: one stroke, one gesture, on deal */
  .band path {
    stroke-dasharray: 120;
    stroke-dashoffset: 120;
    animation: draw 900ms cubic-bezier(0.2, 0.6, 0.2, 1) forwards;
  }
  @keyframes draw {
    to { stroke-dashoffset: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .band path { animation: none; stroke-dashoffset: 0; }
  }
</style>