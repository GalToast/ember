// Ember deck schema — content-as-code. Every card is one of five types at one heat level.
export type CardType = 'truth' | 'dare' | 'challenge' | 'ice' | 'topic';
export type DeckId = 'spark' | 'closer' | 'slowburn' | 'afterdark' | 'curious' | 'inferno' | 'custom';

/**
 * Heat scale, extended 1-4 -> 1-10 (owner decision 2026-11-10).
 *
 * WHY: every adult card used to sit at 4, so `curious` and `inferno` were the same number in the
 * data while the UI advertised six graduated meters, and there was no rung above 4 on which to hang
 * anything hotter. Extending it makes "nastier" ADDITIVE - new 7-10 cards - instead of a
 * redefinition of the tier everyone already has.
 *
 * The axis is ONE dimension: how far past "implied" the card goes. Not "how kinky". A gentle act
 * at 7 is a contradiction; a filthy sentence at 4 is fine. Monotonicity is what keeps the meters
 * truthful.
 *
 *   1 Warm       affection, easy laughter                      | gate: no
 *   2 Curious    real questions, mild disclosure               | gate: no
 *   3 Flirt      deliberate tension, first explicit talk       | gate: no
 *   4 Bold       explicit language, desire stated plainly      | gate: YES
 *   5 Explicit   unambiguous sexual content                    | gate: yes
 *   6 Specific   acts named concretely, instructions            | gate: yes
 *   7 Intense    power, restraint, sensory, sustained scenes    | gate: yes  (safeword required)
 *   8 Edge       needs negotiation up front, not on the night  | gate: yes  (safeword required)
 *   9 Deep Edge  discussed before you are in the room          | gate: yes  (safeword required)
 *  10 Reserve    the floor of the drawer                       | gate: yes  (safeword required)
 */
export type HeatLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export const HEAT_MIN: HeatLevel = 1;
export const HEAT_MAX: HeatLevel = 10;
/** Level at which adult content begins. */
export const ADULT_GATE: HeatLevel = 4;
/** Level at which a safeword and explicit negotiation are required. */
export const NEGOTIATION_GATE: HeatLevel = 7;
/** Used where a level is absent (custom/legacy rows) so comparisons stay meaningful. */
export const DEFAULT_LEVEL: HeatLevel = 3;
export const ALL_LEVELS: HeatLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Clamp an arbitrary number into the heat scale. Content files are data; trust but verify. */
export function clampLevel(n: number | undefined | null): HeatLevel {
  if (typeof n !== 'number' || !Number.isFinite(n)) return DEFAULT_LEVEL;
  const r = Math.round(n);
  if (r < HEAT_MIN) return HEAT_MIN;
  if (r > HEAT_MAX) return HEAT_MAX;
  return r as HeatLevel;
}

export interface Card {
  id: string;
  deck: DeckId;
  type: CardType;
  /** heat level 1-10 (see HeatLevel); a "spice bomb" is a card hotter than its deck's baseline */
  level: HeatLevel;
  text: string;
  /** optional second line the player delivers WHILE the dare happens */
  speak?: string;
  /** timebox in seconds (dares/challenges) */
  timebox?: number;
  /** auto-generated lower-heat variant */
  soften?: string;
  /** both partners play simultaneously */
  together?: boolean;
  /** spice bomb: surprising heat for its deck; draw engine occasionally favors these */
  bomb?: boolean;
  /** love language this card primarily hits: words of affirmation | quality time | physical touch | acts of service | receiving gifts */
  love?: 'words' | 'time' | 'touch' | 'service' | 'gifts';
}
