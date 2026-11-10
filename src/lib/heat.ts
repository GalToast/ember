/**
 * Heat meter display for the 1-10 scale.
 *
 * Ten 5px dots do not fit beside the type label in the card header (86px with gaps), and shrinking
 * them to 3px makes them unreadable in a dark room. So the meter shows FIVE dots, each covering a
 * half-step of the 10-level scale:
 *
 *   level 1  -> dot 1 full
 *   level 2  -> dot 1 full, dot 2 half
 *   level 3  -> dots 1-2 full
 *   level 4  -> dots 1-2 full, dot 3 half
 *   ...
 *   level 10 -> all 5 full
 *
 * Each dot therefore represents "2 levels", and a half-lit dot distinguishes the odd level inside it.
 * This keeps a familiar 5-dot shape while doubling the resolution, and it degrades honestly: the
 * reader can always tell 4 from 5 (half vs full) and 9 from 10.
 */
export const METER_DOTS = 5;

export type DotState = 'off' | 'half' | 'on';

/** Map a 1-10 heat level onto 5 dots, each of which may be off / half / fully lit. */
export function heatDots(level: number): DotState[] {
  const lv = Math.min(10, Math.max(0, Number.isFinite(level) ? level : 0));
  // levels 0..2 land in dot 0, 2..4 in dot 1, etc. A level exactly on the boundary fills the dot.
  const out: DotState[] = [];
  for (let i = 0; i < METER_DOTS; i++) {
    const lowBound = i * 2;        // levels strictly above this...
    const highBound = (i + 1) * 2; // ...up to and including this fill the dot
    if (lv >= highBound) out.push('on');
    else if (lv > lowBound) out.push('half');
    else out.push('off');
  }
  return out;
}

/**
 * Card-level heat band class for styling. Three bands, because a visual treatment per level would be
 * meaningless at 10 steps - what matters is the GATE (4) and the NEGOTIATION line (7).
 *   l4          level 4 exactly  -> the adult gate, first warm glow
 *   heat-deep   5-8              -> explicit through edge
 *   heat-reserve 9-10            -> deep edge and reserve
 */
export function heatBand(level: number): string {
  const lv = Number.isFinite(level) ? level : 0;
  if (lv >= 9) return 'heat-reserve';
  if (lv >= 5) return 'heat-deep';
  if (lv >= 4) return 'l4';
  return '';
}
