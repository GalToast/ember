import type { Card, Deck, DeckId } from './schema';

export type Mode = 'chill' | 'heat' | 'mixup' | 'inferno';

export const MODES: { id: Mode; name: string; blurb: string; bomb?: boolean }[] = [
  { id: 'chill', name: 'Chill', blurb: 'easy laughs and warm talk' },
  { id: 'mixup', name: 'Mixup', blurb: 'everything, shuffled' },
  { id: 'heat', name: 'Heat', blurb: 'turn it up' },
  { id: 'inferno', name: 'Inferno', blurb: 'all spice bombs. you were warned (literally)', bomb: true },
];

// raw deck modules are JSON imports; loaded eagerly (tiny payloads, fully offline)
import spark from '../../content/decks/spark.json';
import closer from '../../content/decks/closer.json';
import slowburn from '../../content/decks/slowburn.json';
import afterdark from '../../content/decks/afterdark.json';
import curious from '../../content/decks/curious.json';
import inferno from '../../content/decks/inferno.json';

export const DECKS: Record<DeckId, Deck> = Object.fromEntries(
  [spark, closer, slowburn, afterdark, curious, inferno].map((d) => [d.id, d as unknown as Deck]),
) as Record<DeckId, Deck>;

function decksFor(mode: Mode): DeckId[] {
  if (mode === 'chill') return ['spark', 'closer'];
  if (mode === 'mixup') return ['spark', 'closer', 'slowburn', 'afterdark', 'curious'];
  if (mode === 'inferno') return ['inferno'];
  return ['slowburn', 'afterdark', 'curious']; // heat
}

const seen = new Set<string>();

export function draw(mode: Mode, except?: Card): Card | null {
  const pool = decksFor(mode).flatMap((id) => DECKS[id].cards).filter((c) => c.id !== except?.id);
  if (pool.length === 0) return null;
  let fresh = pool.filter((c) => !seen.has(c.id));
  if (fresh.length === 0) {
    seen.clear();
    fresh = pool;
  }
  // 1-in-5 draws prefer spice bombs when any are unseen
  const bombs = fresh.filter((c) => c.bomb);
  const card =
    bombs.length > 0 && Math.random() < 0.2
      ? bombs[Math.floor(Math.random() * bombs.length)]
      : fresh[Math.floor(Math.random() * fresh.length)];
  seen.add(card.id);
  return card;
}

export function markSeen(id: string) {
  seen.add(id);
}

// --- persistent (localStorage) ---
const KEY = 'ember.v1';

export interface NightLog { date: string; cards: number; mode: Mode }
export interface Persisted { names: { a: string; b: string }; nights: NightLog[] }

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch { /* fresh start */ }
  return { names: { a: '', b: '' }, nights: [] };
}

export function save(p: Persisted) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
}

// soft chime — no assets
export function chime() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.4);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1);
  } catch { /* silence is fine */ }
}
