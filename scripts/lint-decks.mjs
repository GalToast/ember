// Ember lint — structural integrity for every deck JSON.
// Checks: parse, schema fields, id pattern/unique, type/level enums, deck match,
// text length caps, soften presence on dares/challenges, banned clinical words.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DECKS_DIR = 'content/decks';
const TYPES = ['truth', 'dare', 'challenge', 'ice', 'topic'];
const STILTED = /^Invite them to |^Invite a |^Invite an /;
const BANNED = [/reconnect/i, /\brepair\b/i, /\bhealing\b/i, /communication exercise/i, /emotional intimacy/i, /therapy/i, /therapist/i];
// spark/closer may carry spice bombs one level above baseline; inferno is all-bombs L4
const LEVELS = { spark: [1, 2], closer: [2, 3], slowburn: [3, 4], afterdark: [4], curious: [4], inferno: [4] };
const files = existsSync(DECKS_DIR) ? readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json')) : [];

if (files.length === 0) {
  console.error('FAIL: no deck files found in content/decks/');
  process.exit(1);
}

let errors = 0;
const fail = (f, id, msg) => { console.error(`FAIL ${f}${id ? ':' + id : ''}: ${msg}`); errors++; };
const seenIds = new Set();

for (const f of files) {
  let deck;
  try { deck = JSON.parse(readFileSync(join(DECKS_DIR, f), 'utf8')); }
  catch (e) { fail(f, null, `invalid JSON: ${e.message}`); continue; }

  const deckId = f.replace('.json', '');
  if (deck.id !== deckId) fail(f, null, `deck.id "${deck.id}" != filename "${deckId}"`);
  if (!deck.name || typeof deck.name !== 'string') fail(f, null, 'missing deck.name');
  if (typeof deck.adult !== 'boolean') fail(f, null, 'missing deck.adult boolean');
  if (!Array.isArray(deck.cards) || deck.cards.length === 0) fail(f, null, 'deck.cards empty');
  else {
    const texts = new Set();
    for (const c of deck.cards) {
      const label = `${deckId}:${c.id ?? '?'}`;
      if (!c.id || typeof c.id !== 'string') fail(f, null, 'card missing id');
      if (seenIds.has(c.id)) fail(f, c.id, 'duplicate card id');
      seenIds.add(c.id);
      if (!c.id?.startsWith(deckId + '-')) fail(f, c.id, `id not prefixed with ${deckId}-`);
      if (!TYPES.includes(c.type)) fail(f, c.id, `bad type "${c.type}"`);
      if (!LEVELS[deckId]?.includes(c.level)) fail(f, c.id, `level ${c.level} not allowed for deck ${deckId} (want ${LEVELS[deckId]})`);
      if (!c.text || typeof c.text !== 'string') fail(f, c.id, 'missing text');
      else if (c.text.length > 160) fail(f, c.id, `text too long (${c.text.length} > 160)`);
      else if (BANNED.some((r) => r.test(c.text))) fail(f, c.id, 'banned clinical word in text');
      else if (STILTED.test(c.text)) console.log(`warn ${f}:${c.id}: stilted prefix (rewrite: direct command)`);
      if (c.speak !== undefined && (typeof c.speak !== 'string' || c.speak.length > 120)) fail(f, c.id, 'speak must be string <= 220');
      if (c.soften !== undefined && typeof c.soften !== 'string') fail(f, c.id, 'soften must be string');
      if (c.timebox !== undefined && (!Number.isFinite(c.timebox) || c.timebox < 10 || c.timebox > 1500)) fail(f, c.id, 'timebox must be 10-1500s');
      if (c.bomb !== undefined && typeof c.bomb !== 'boolean') fail(f, c.id, 'bomb must be boolean');
      const LOVES = ['words', 'time', 'touch', 'service', 'gifts'];
      if (c.love !== undefined && !LOVES.includes(c.love)) fail(f, c.id, `love must be one of ${LOVES.join('|')}`);
      if ((c.type === 'dare' || c.type === 'challenge') && !c.soften) fail(f, c.id, `${c.type} missing soften variant`);
      const key = c.text.toLowerCase().replace(/\s+/g, ' ').trim();
      if (texts.has(key)) fail(f, c.id, 'duplicate text');
      texts.add(key);
    }
  }
  console.log(`ok ${f}: ${deck.cards?.length ?? 0} cards, adult=${deck.adult}${deck.cards ? ', love=' + [...new Set(deck.cards.map((c) => c.love).filter(Boolean))].join('/') : ''}`);
}

if (errors > 0) { console.error(`\nLINT FAILED: ${errors} problem(s)`); process.exit(1); }
console.log('\nLINT PASSED: all decks clean');
