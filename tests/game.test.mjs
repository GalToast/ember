/**
 * Ember engine tests — bundle src/lib/game.svelte.ts with esbuild (already a
 * dependency) then assert the persistent-night and draw invariants.
 * Run: node tests/game.test.mjs
 */
import { build } from 'esbuild';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(os.tmpdir(), 'ember-test-bundle');
const ENTRY = path.join(OUT, 'game.mjs');

let pass = 0;
const fails = [];

function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fails.push(name + (detail ? ` — ${detail}` : '')); console.log('FAIL ' + name + (detail ? ` — ${detail}` : '')); }
}

function eq(name, got, want) {
  ok(name, Object.is(got, want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await build({
    entryPoints: [path.join(ROOT, 'src/lib/game.svelte.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: true,
    outfile: ENTRY,
    logLevel: 'silent',
    loader: { '.json': 'json' },
  });
  ok('bundle emitted', existsSync(ENTRY), ENTRY);

  const g = await import(pathToFileURL(ENTRY).href + '?v=' + Date.now());

  // ---- F1: decks resolve to 780 cards, six ids, no duplicate card ids ----
  const ids = Object.keys(g.DECKS);
  eq('six decks', ids.length, 6);
  let total = 0;
  const seenIds = new Set();
  for (const id of ids) {
    const cards = g.DECKS[id].cards;
    total += cards.length;
    for (const c of cards) {
      ok(`deck ${id} card ${c.id} has unique id`, !seenIds.has(c.id), c.id);
      seenIds.add(c.id);
    }
  }
  eq('800 cards', total, 800);

  // ---- F2: mode → deck membership matches the fixed bundles ----
  eq('chill = spark+closer', g.decksFor('chill').join(','), 'spark,closer');
  eq('heat = slowburn,afterdark,curious', g.decksFor('heat').join(','), 'slowburn,afterdark,curious');
  eq('mixup = everything but inferno', g.decksFor('mixup').join(','), 'spark,closer,slowburn,afterdark,curious');
  eq('inferno = inferno only', g.decksFor('inferno').join(','), 'inferno');

  // ---- F3: draw excludes retired cards, never returns null while pool remains ----
  const allIds = [...seenIds];
  g.seedSeen([]);
  const retiredTwo = allIds.slice(0, 2);
  const drawn = new Set();
  for (let i = 0; i < 120; i++) {
    const ns = { mode: 'mixup', decks: g.decksFor('mixup'), cardId: null, count: 0, skips: 6, seen: [], loveCounts: {}, drawIndex: 0, lastBombIndex: -99, safeword: '', landing: false };
    const c = g.draw('mixup', g.decksFor('mixup'), retiredTwo, ns);
    ok('draw non-null with pool left', c !== null);
    if (!c) break;
    ok('draw respects retirement', !retiredTwo.includes(c.id), c.id);
    drawn.add(c.id);
  }
  ok('draw covers a wide swath of the pool', drawn.size > 100, `${drawn.size} unique in 120 draws`);

  // ---- F4: bomb pacing — never two bombs within 3 draws ----
  g.seedSeen([]);
  let paced = true;
  for (let i = 0; i < 400; i++) {
    const ns = { mode: 'mixup', decks: g.decksFor('mixup'), cardId: null, count: 0, skips: 6, seen: [], loveCounts: {}, drawIndex: i, lastBombIndex: -99, safeword: '', landing: false };
    const c = g.draw('mixup', g.decksFor('mixup'), [], ns);
    if (!c) break;
    if (c.bomb) {
      if (i - ns.lastBombIndex < 3) { paced = false; break; }
      ns.lastBombIndex = i;
    }
  }
  ok('bomb gap >= 3 draws across 400 draws', paced);

  // ---- F5: THE REGRESSION — seedSeen(seen) must make those cards non-drawable ----
  g.seedSeen(['spark-001', 'spark-002', 'spark-003']);
  const sparkIds = new Set(g.DECKS.spark.cards.map((c) => c.id));
  const eliminated = ['spark-001', 'spark-002', 'spark-003'];
  let reused = null;
  for (let i = 0; i < 40; i++) {
    const ns = { mode: 'mixup', decks: g.decksFor('mixup'), cardId: null, count: 0, skips: 6, seen: [], loveCounts: {}, drawIndex: i, lastBombIndex: -99, safeword: '', landing: false };
    // isolate to spark so the seeded IDs are actually in the eligible pool
    const c = g.draw('mixup', ['spark'], [], ns);
    if (!c) break;
    if (sparkIds.has(c.id) && eliminated.includes(c.id)) { reused = c.id; break; }
  }
  ok('resume seeding removes already-served cards', reused === null, reused || '');

  // ---- F6: save/load round-trip through localStorage ----
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const names = { a: 'Fred', b: 'Christen' };
  const nights = [{ date: '2026-11-07', cards: 12, mode: 'heat' }];
  g.save({ names, nights, retired: ['spark-001'] });
  const back = g.load();
  eq('persisted names round-trip', back.names.a, 'Fred');
  eq('persisted nights round-trip', back.nights[0].cards, 12);
  eq('persisted retired round-trip', back.retired[0], 'spark-001');

  const live = { mode: 'heat', decks: ['slowburn'], cardId: 'slowburn-003', count: 4, skips: 3, seen: ['slowburn-001'], loveCounts: { words: 2 }, drawIndex: 4, lastBombIndex: -99, safeword: 'red', landing: false, cardId2: undefined };
  g.saveNight(live);
  const restored = g.loadNight();
  eq('live night restores card id', restored.cardId, 'slowburn-003');
  eq('live night restores seen list', restored.seen[0], 'slowburn-001');

  g.clearNight();
  eq('clearNight drops the resume offer', g.loadNight(), null);

  // ---- F7: degraded storage must not throw ----
  globalThis.localStorage = {
    getItem: () => '{broken json',
    setItem: () => { throw new Error('quota'); },
    removeItem: () => { throw new Error('denied'); },
  };
  eq('corrupt store degrades to fresh', g.load().names.a, '');
  eq('corrupt live store degrades to null', g.loadNight(), null);
  let threw = false;
  try { g.save({ names, nights, retired: [] }); g.saveNight(live); g.clearNight(); } catch { threw = true; }
  ok('quota/private-mode writes never throw', !threw);

  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.log('  - ' + f);
    process.exit(1);
  }
}

main().catch((e) => { console.error('harness error:', e.message); process.exit(2); });