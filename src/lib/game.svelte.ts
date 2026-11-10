import type { Card, Deck, DeckId } from './schema';
import { clampLevel, type HeatLevel } from './schema';

/** Default heat ceiling for a night (10-level scale). See draw()'s HEAT CEILING comment. */
export const DEFAULT_HEAT_CEILING: HeatLevel = 6;

export type Mode = 'chill' | 'heat' | 'mixup' | 'inferno';
export type Love = 'words' | 'time' | 'touch' | 'service' | 'gifts';

export const MODES: { id: Mode; name: string; blurb: string; bomb?: boolean }[] = [
  { id: 'chill', name: 'Chill', blurb: 'easy laughs and warm talk' },
  { id: 'mixup', name: 'Mixup', blurb: 'everything but Inferno, shuffled' },
  { id: 'heat', name: 'Heat', blurb: 'turn it up' },
  { id: 'inferno', name: 'Inferno', blurb: 'all spice bombs. you were warned (literally)', bomb: true },
];

export const ALL_DECKS: DeckId[] = ['spark', 'closer', 'slowburn', 'afterdark', 'curious', 'inferno'];

import spark from '../../content/decks/spark.json';
import closer from '../../content/decks/closer.json';
import slowburn from '../../content/decks/slowburn.json';
import afterdark from '../../content/decks/afterdark.json';
import curious from '../../content/decks/curious.json';
import inferno from '../../content/decks/inferno.json';

export const DECKS: Record<DeckId, Deck> = Object.fromEntries(
  [spark, closer, slowburn, afterdark, curious, inferno].map((d) => [d.id, d as unknown as Deck]),
) as Record<DeckId, Deck>;

export function decksFor(mode: Mode): DeckId[] {
  if (mode === 'chill') return ['spark', 'closer'];
  if (mode === 'mixup') return ['spark', 'closer', 'slowburn', 'afterdark', 'curious'];
  if (mode === 'inferno') return ['inferno'];
  return ['slowburn', 'afterdark', 'curious'];
}

// ---- persistent state (localStorage) ----
const KEY = 'ember.v1';
const NIGHT_KEY = 'ember.night';

export interface NightLog { date: string; cards: number; mode: Mode; loves?: Record<string, number>; tokensSpent?: { a: number; b: number } }
export interface Persisted { names: { a: string; b: string }; nights: NightLog[]; retired: string[]; custom?: Card[] }

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { retired: [], ...JSON.parse(raw) };
  } catch { /* fresh start */ }
  return { names: { a: '', b: '' }, nights: [], retired: [] };
}

export function save(p: Persisted) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
}

// ---- live night state (persisted every mutation so interruptions never lose a night) ----
export interface NightState {
  mode: Mode;
  decks: DeckId[];
  cardId: string | null;
  count: number;
  skips: number;
  seen: string[];
  loveCounts: Record<string, number>;
  drawIndex: number;
  lastBombIndex: number;
  safeword: string;
  landing: boolean;
  /**
   * Top heat level this couple has opted into (10-level scale). Cards above it are never dealt.
   * Optional so existing persisted nights keep working; draw() falls back to DEFAULT_HEAT_CEILING.
   */
  heatCeiling?: HeatLevel;
  /** command tokens: 3 per player per night, spent on unrefusable orders */
  tokens: { a: number; b: number };
  /** whose turn the night is on (alternates each draw) — token display + fair spending */
  turn: 'a' | 'b';
  /** pass-the-phone night: private cards + handoff flow; resume must respect privacy */
  ptp?: boolean;
  /** release token: ONE per night, held by the current turn player; 'held'|'spent'|'gifted' */
  release?: { holder: 'a' | 'b'; state: 'held' | 'spent' | 'gifted' };
  /** last draw's card type (truth/topic/dare/challenge) — pacing cap: never 3 same-type in a row */
  lastType?: string;
  /** consecutive same-type draws so far */
  typeRun?: number;
}

export function loadNight(): NightState | null {
  try {
    const raw = localStorage.getItem(NIGHT_KEY);
    if (raw) {
      const n = JSON.parse(raw) as NightState;
      if (n.cardId && n.count > 0) return { loveCounts: {}, safeword: '', landing: false, tokens: { a: 3, b: 3 }, turn: 'a', release: { holder: 'a', state: 'held' }, ...n };
    }
  } catch { /* ignore */ }
  return null;
}

export function saveNight(n: NightState) {
  try { localStorage.setItem(NIGHT_KEY, JSON.stringify(n)); } catch { /* ignore */ }
}

export function clearNight() {
  try { localStorage.removeItem(NIGHT_KEY); } catch { /* ignore */ }
}

// ---- custom cards ("Our Deck") — written by the couple, stored in localStorage ----
const CUSTOM_KEY = 'ember.custom';

export function loadCustom(): Card[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (raw) { const a = JSON.parse(raw); if (Array.isArray(a)) return a; }
  } catch { /* fresh */ }
  return [];
}

export function saveCustom(cards: Card[]) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(cards)); } catch { /* private mode */ }
}

export interface CustomValidation { ok: boolean; errors: string[] }

/** House rules for user-written cards — the same gates the shipped decks pass. */
export function validateCustom(c: Partial<Card>, allCustom: Card[]): CustomValidation {
  const errors: string[] = [];
  const text = (c.text ?? '').trim();
  const speak = (c.speak ?? '').trim();
  const soften = (c.soften ?? '').trim();
  if (!text) errors.push('write the card');
  else {
    if (text.length > 160) errors.push(`too long (${text.length}/160)`);
    const unquoted = text.replace(/"[^"]*"|'[^']*'/g, ' ');
    if (/\bmy\b/i.test(unquoted) || /^I /i.test(unquoted)) errors.push('speak to "you/they", not "my/I" (outside quotes)');
    if (/\s\/\s|\/\s|\s\//.test(unquoted)) errors.push('no slash-choices — pick one act');
    if (/\bcock\b|\bpussy\b|\bdick\b|\btits?\b|\bclit\b/i.test(text)) errors.push('anatomy stays neutral — verbs carry the filth');
    if (/reconnect|\brepair\b|healing|therapy/i.test(text)) errors.push('no therapy words');
  }
  if ((c.type === 'dare' || c.type === 'challenge') && !soften) errors.push('dares need a softer variant');
  if (soften.length > 160) errors.push(`soften too long (${soften.length}/160)`);
  if (speak.length > 120) errors.push(`speak line too long (${speak.length}/120)`);
  const norm = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (allCustom.some((x) => x.text.toLowerCase().replace(/\s+/g, ' ').trim() === norm)) errors.push('duplicate of an existing custom card');
  return { ok: errors.length === 0, errors };
}

export function newCustomCard(type: Card['type'], author: 'a' | 'b'): Card {
  const all = loadCustom();
  const id = `custom-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
  return { id, deck: 'custom' as DeckId, type, level: 3, text: '', love: 'touch', author } as unknown as Card;
}

const seen = new Set<string>();

export function draw(mode: Mode, decks: DeckId[], retired: string[], ns: NightState, except?: Card, customCards?: Card[]): Card | null {
  const retiredSet = new Set(retired);
  // HEAT CEILING (10-level scale, 2026-11-10). Without this, the first level-8 card anyone writes
  // into a deck would be dealt to couples who never opted into that band. `night.heatCeiling` is the
  // top level this couple has agreed to; anything above it is simply not in the pool.
  // Default 6 preserves the pre-migration feel (everything used to be level 4) while leaving the
  // negotiable tiers opt-in only.
  const ceiling = ns.heatCeiling ?? DEFAULT_HEAT_CEILING;
  let pool = decks
    .flatMap((id) => (DECKS[id] ? DECKS[id].cards : []))
    .concat(customCards ?? [])
    .filter((c) => c.id !== except?.id && !retiredSet.has(c.id) && !seen.has(c.id) && clampLevel(c.level) <= ceiling);
  // bomb pacing: no bomb within 3 draws of the last one
  const bombGap = ns.drawIndex - ns.lastBombIndex;
  if (bombGap < 3) {
    const calm = pool.filter((c) => !c.bomb);
    if (calm.length > 0) pool = calm;
  }
  if (pool.length === 0) {
    // deck exhausted: reset seen, retry once (custom cards stay in the pool)
    seen.clear();
    pool = decks.flatMap((id) => DECKS[id].cards).concat(customCards ?? []).filter((c) => c.id !== except?.id && !retiredSet.has(c.id) && clampLevel(c.level) <= ceiling);
    if (pool.length === 0) return null;
  }
  // love-language balancing: half the time, prefer the least-served love language
  let card: Card | undefined;
  const loves = Object.entries(ns.loveCounts || {});
  if (loves.length > 0 && Math.random() < 0.5) {
    const min = Math.min(...loves.map(([, n]) => n));
    const starved = loves.filter(([, n]) => n === min).map(([l]) => l);
    const balanced = pool.filter((c) => c.love && starved.includes(c.love));
    if (balanced.length > 0) pool = balanced;
  }
  // pacing cap: never deal 3+ same-type cards in a row (ICE-ICE-ICE runs read flat)
  if (ns.lastType && (ns.typeRun ?? 0) >= 2) {
    const varied = pool.filter((c) => c.type !== ns.lastType);
    if (varied.length > 0) pool = varied;
  }
  const bombs = pool.filter((c) => c.bomb);
  if (bombs.length > 0 && Math.random() < 0.2) card = bombs[Math.floor(Math.random() * bombs.length)];
  else card = pool[Math.floor(Math.random() * pool.length)];
  if (!card) return null;
  seen.add(card.id);
  return card;
}

export function drawWarmLanding(decks: DeckId[], retired: string[]): Card | null {
  const retiredSet = new Set(retired);
  const base = ['spark', 'closer'].flatMap((id) => (DECKS[id] ? DECKS[id].cards : []));
  const pool = base
    .filter((c) => !retiredSet.has(c.id) && !seen.has(c.id) && (c.type === 'truth' || c.type === 'topic' || c.type === 'challenge') && (c.level ?? 9) <= 2 && c.love !== 'touch');
  if (pool.length > 0) {
    const card = pool[Math.floor(Math.random() * pool.length)];
    seen.add(card.id);
    return card;
  }
  // fallback: everything gentle is already seen tonight. Prefer the OLDEST-seen card
  // (furthest back in the night) so the landing never echoes the card you just played,
  // and only randomize among the first third of the night's history.
  const gentle = base.filter((c) => !retiredSet.has(c.id) && (c.type === 'truth' || c.type === 'topic' || c.type === 'challenge') && (c.level ?? 9) <= 2 && c.love !== 'touch');
  if (gentle.length === 0) return null;
  const nightSeen = [...seen];
  const oldestFirst = gentle
    .map((c) => ({ c, at: nightSeen.indexOf(c.id) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at);
  const candidates = (oldestFirst.length > 0 ? oldestFirst.slice(0, Math.max(3, Math.ceil(oldestFirst.length / 3))).map((x) => x.c) : gentle);
  const card = candidates[Math.floor(Math.random() * candidates.length)];
  seen.add(card.id);
  return card;
}

export function markSeen(id: string) {
  seen.add(id);
}

/** Persisted truth for the seen set. The engine's `seen` is module-scoped, so
 *  resume must re-seed it or cards served before the interruption come back. */
export function seenIds(): string[] {
  return [...seen];
}

export function seedSeen(ids: string[]): void {
  seen.clear();
  for (const id of ids) if (typeof id === 'string' && id) seen.add(id);
}

export function trackLove(ns: NightState, card: Card) {
  if (card.love) {
    ns.loveCounts = ns.loveCounts || {};
    ns.loveCounts[card.love] = (ns.loveCounts[card.love] || 0) + 1;
  }
  if (card.bomb) ns.lastBombIndex = ns.drawIndex;
  // pacing: track same-type runs so draw() can cap them at 2
  if (ns.lastType === card.type) ns.typeRun = (ns.typeRun ?? 0) + 1;
  else {
    ns.lastType = card.type;
    ns.typeRun = 1;
  }
}

// ---- audio: create the context inside a user gesture so mobile autoplay policies never eat the chime ----
let ctx: AudioContext | null = null;
export function unlockAudio() {
  try {
    if (!ctx) (ctx as unknown as AudioContext | null) = new AudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch { /* silence is fine */ }
}

export function chime() {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
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
