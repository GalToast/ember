<script lang="ts">
  /**
   * DeckWatermark — each deck has a signature visual motif.
   * Rendered as a subtle background SVG behind the card content.
   * Opacity is low (0.04-0.08) so it reads as texture, not decoration.
   */
  import type { DeckId } from '../lib/schema';

  let { deck }: { deck: DeckId } = $props();

  // Each deck gets a distinct geometric motif — thin strokes, currentColor
  const motifs: Record<DeckId, string> = {
    // Spark: scattered starbursts — easy laughs, light touches
    spark: 'M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8',

    // Closer: interlocking circles — connection, conversation
    closer: 'M8 12a4 4 0 1 1 8 0 4 4 0 1 1-8 0ZM12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8Z',

    // Slow Burn: flame wisps — sensual, building tension
    slowburn: 'M12 3c1 3-2 4.5-2 8a2 2 0 0 0 4 .2C14 8 16 9.5 15.5 13A4.5 4.5 0 0 1 6.6 12C6 7.5 10 6 12 3Z',

    // After Dark: crescent moon — explicit, invitation-only
    afterdark: 'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z',

    // Curious: question mark that doubles as a key — kink exploration
    curious: 'M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.5.5-2 1-2 2.5M12 17v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',

    // Inferno: abstract flame shards — all spice, no mercy
    inferno: 'M12 3c0 3-3 4-3 7M12 3c0 3 3 4 3 7M6 21c0-6 6-8 6-14 0 6 6 8 6 14M3 16c2-3 4-4 6-5M21 16c-2-3-4-4-6-5',
  };
</script>

<svg class="deck-watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={motifs[deck] ?? motifs.spark} />
</svg>

<style>
  .deck-watermark {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.04;
    pointer-events: none;
    z-index: 0;
  }
</style>