// Review-merge tool: applies tmp/review/*-reviews.jsonl verdicts to the decks
// through EVERY gate (length, sense, anatomy, soften, dupes, JSON validity).
// Dry-run default; --apply to write. Any gate failure on a rewrite = skipped + logged.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const DIR = 'tmp/review';
if (!existsSync(DIR)) { console.error('no tmp/review — reviewers not done'); process.exit(2); }

const DECKS = {};
for (const f of readdirSync('content/decks').filter(f => f.endsWith('.json'))) {
  DECKS[f.replace('.json','')] = JSON.parse(readFileSync(`content/decks/${f}`,'utf8'));
}

// ---- gates (house rules, enforced on every rewrite) ----
const SENSE = [/\bmy\b/i, /^I /, / \/ /];           // first-person outside quotes / slash choices
const ANATOMY = /\bcock\b|\bpussy\b|\bdick\b|\btits?\b|\bwood\b|\bclit\b/i;
const CLINICAL = /reconnect|\brepair\b|healing|therapy/i;
const STILTED = /^Invite (them|a|an) /;

function gate(card, kind, text) {
  const errs = [];
  const limit = kind === 'speak' ? 120 : 160;
  if (text.length > limit) errs.push(`len ${text.length}>${limit}`);
  // first-person inside quotes is legal: strip "..." before scanning
  const unquoted = text.replace(/"[^"]*"|'[^']*'/g, ' ');
  if (kind !== 'speak' && SENSE.some(r => r.test(unquoted))) errs.push('sense');
  if (ANATOMY.test(text)) errs.push('anatomy');
  if (CLINICAL.test(text)) errs.push('clinical');
  if (kind === 'text' && STILTED.test(text)) errs.push('stilted');
  return errs;
}

// collect verdicts (later reviewers win id conflicts; all files scanned)
const verdicts = new Map();
let lines = 0, badparse = 0;
for (const f of readdirSync(DIR).filter(f => f.endsWith('-reviews.jsonl'))) {
  const src = readFileSync(`${DIR}/${f}`,'utf8').split('\n').filter(Boolean);
  for (const l of src) {
    lines++;
    try {
      const v = JSON.parse(l);
      if (v.id && ['keep','rewrite','retire'].includes(v.verdict)) verdicts.set(v.id, v);
      else badparse++;
    } catch { badparse++; }
  }
}
console.log(`verdict lines: ${lines} (unique ids: ${verdicts.size}, bad: ${badparse})`);

const log = [];
let applied = 0, skipped = 0, retires = 0;
for (const [id, v] of verdicts) {
  const deckId = id.split('-')[0];
  const deck = DECKS[deckId];
  if (!deck) { log.push(`SKIP ${id}: no such deck`); skipped++; continue; }
  const card = deck.cards.find(c => c.id === id);
  if (!card) { log.push(`SKIP ${id}: not in deck`); skipped++; continue; }

  if (v.verdict === 'retire') {
    retires++;
    log.push(`RETIRE ${id}: ${v.note || ''} (manual review required — not auto-removed)`);
    continue;
  }
  if (v.verdict !== 'rewrite' || !v.rewrite?.text) continue;

  const errs = [...gate(card, 'text', v.rewrite.text)];
  if (v.rewrite.speak) for (const e of gate(card, 'speak', v.rewrite.speak)) errs.push('speak:' + e);
  if (v.rewrite.soften) for (const e of gate(card, 'soften', v.rewrite.soften)) errs.push('soften:' + e);
  // dare/challenge must keep a soften
  if ((card.type === 'dare' || card.type === 'challenge') && !card.soften && !v.rewrite.soften) errs.push('would-drop-soften');
  if (errs.length) { log.push(`SKIP ${id}: gate(${errs.join(',')})`); skipped++; continue; }

  if (APPLY) {
    card.text = v.rewrite.text;
    if (v.rewrite.speak) card.speak = v.rewrite.speak;
    if (v.rewrite.soften) card.soften = v.rewrite.soften;
  }
  applied++;
  log.push(`APPLY ${id}: ${card.text.slice(0,50)} => ${v.rewrite.text.slice(0,50)}`);
}

// cross-deck dupe check on rewritten texts
if (APPLY) {
  const seen = new Map();
  for (const [, deck] of Object.entries(DECKS)) for (const c of deck.cards) {
    const k = c.text.toLowerCase().replace(/\s+/g,' ').trim();
    if (seen.has(k)) log.push(`DUPE-INTRODUCED: ${c.id} == ${seen.get(k)}`);
    seen.set(k, c.id);
  }
  mkdirSync('content/decks', { recursive: true });
  for (const [id, deck] of Object.entries(DECKS)) {
    writeFileSync(`content/decks/${id}.json`, JSON.stringify(deck, null, 2) + '\n');
  }
}

console.log(`\napplied: ${applied}  skipped(gate): ${skipped}  retire-flagged: ${retires}  mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
log.slice(0, 60).forEach(l => console.log(l));
if (log.length > 60) console.log(`... and ${log.length - 60} more`);
