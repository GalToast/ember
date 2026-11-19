/**
 * Seeds — the night's two-sided authorship.
 *
 * Before a night starts, each partner privately writes ONE wish and ONE boundary.
 * During the night the wish arrives as an ordinary-looking card that does not say
 * who wrote it. At the finale the app names the author.
 *
 * PRIVACY CONTRACT (the whole mechanic depends on it):
 * - A seed's text is never rendered outside its own card, and never to the partner
 *   while they are still typing theirs (the entry flow is one holder at a time).
 * - The dealt card carries no author badge. If it did, the reveal at the end would
 *   be a formality instead of the point.
 * - Seeds are device-local, like the rest of Ember (no backend, nothing leaves).
 */

import type { Card } from './schema';

export interface Seed {
  /** who wrote it */
  who: 'a' | 'b';
  /** what they want more of — arriving as the partner's card */
  wish: string;
  /** what is off the table tonight — never dealt, only honoured */
  boundary: string;
  /** card number it was dealt at (1-based), set when it arrives */
  at?: number;
  /** the card id it became, so a resumed night can rebuild it */
  cardId?: string;
}

/** Pre-night storage: planted but not yet carried into a night. Separate from the
 *  night so planting and playing can be different sittings without leaking. */
const KEY = 'ember.seeds';

export function loadSeeds(): Seed[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s) => s && (s.who === 'a' || s.who === 'b') && typeof s.wish === 'string' && s.wish.trim())
      .map((s) => ({ who: s.who, wish: String(s.wish).trim().slice(0, 180), boundary: String(s.boundary ?? '').trim().slice(0, 180) }));
  } catch {
    return [];
  }
}

export function saveSeeds(seeds: Seed[]) {
  try {
    if (seeds.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(seeds));
  } catch {
    /* private mode — seeds are a nicety, never a blocker */
  }
}

export function clearSeeds() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Card numbers where a seed arrives: early enough to shape the night, late enough
 *  that the couple has warmed up first. Two seeds, two moments, never adjacent. */
export const SEED_AT = [3, 7];

/** The seed that is due for the card about to be dealt, if any. */
export function dueSeed(seeds: Seed[] | undefined, nextCardNumber: number): Seed | undefined {
  if (!seeds || !SEED_AT.includes(nextCardNumber)) return undefined;
  return seeds.find((s) => !s.at);
}

/**
 * The card a seed becomes.
 *
 * The text deliberately does NOT name the author — that is the reveal. It does say
 * "somebody wrote this before you sat down", because pretending it is an ordinary
 * card would be a lie the couple could feel, and mystery is the better game.
 */
export function seedToCard(seed: Seed, cardNumber: number): Card {
  const who = seed.who;
  return {
    id: `seed-${who}-${cardNumber}`,
    deck: 'custom',
    type: 'truth',
    level: 2,
    text: `Somebody wrote this before you sat down. Say it out loud, word for word: “${seed.wish}” Then tell them what it stirs.`,
    soften: 'Say it smaller — one sentence, no detail, no explaining.',
  } as Card;
}

/** Rebuild a dealt seed card on resume (the card is not in any deck). */
export function seedCardById(id: string | null, seeds: Seed[] | undefined): Card | null {
  if (!id || !seeds) return null;
  const seed = seeds.find((s) => s.cardId === id || (s.at !== undefined && `seed-${s.who}-${s.at}` === id));
  if (!seed) return null;
  return seedToCard(seed, seed.at ?? 0);
}

/** Attribution line for the finale. */
export function plantedLine(seed: Seed, names: { a: string; b: string }): string {
  return seed.who === 'a' ? (names.a || 'They') : (names.b || 'They');
}
