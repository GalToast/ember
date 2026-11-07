// Fit lint — make the card text envelope a checked invariant, not a hope.
//
// Why: the card is `overflow:hidden` with `touch-action:none`, so text that does not
// fit is cut off with no scrollbar and no error. Measured 2026-11-07 (600 cards x
// 3 viewports, live card, real strings) the shipping content is clean: longest
// effective length 249 -> band `sm`, worst text height 290 px inside a 485 px card
// at 360x640. `xs` (>260) is dormant by design and has zero cards.
//
// So the rule is the band ladder's own ceiling, enforced:
//   effective length = visible text + 1.6 * speak length + 40 * (timer ? 1 : 0)
//   assert effective length <= 260   (=> no card ever enters the xs band)
//
// A card that enters xs is not automatically broken (tablet has 336 px headroom),
// but on the 360x640 phone it is where the card stops fitting with a long speak
// block. Keeping the ceiling means the small-screen case is never an accident.
//
// Exit 0 = all decks inside the envelope. Exit 1 = offending ids listed.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DECKS_DIR = 'content/decks';
const CEILING = 260;

if (!existsSync(DECKS_DIR)) {
  console.error(`lint-fit: ${DECKS_DIR} missing — run from the repo root.`);
  process.exit(1);
}

const files = readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json')).sort();
if (files.length === 0) {
  console.error(`lint-fit: no decks in ${DECKS_DIR}`);
  process.exit(1);
}

const offenders = [];
let total = 0;
const perDeck = [];

for (const file of files) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(join(DECKS_DIR, file), 'utf8'));
  } catch (e) {
    console.error(`lint-fit: ${file} does not parse — ${e.message}`);
    process.exit(1);
  }
  const cards = Array.isArray(doc) ? doc : doc.cards;
  if (!Array.isArray(cards)) {
    console.error(`lint-fit: ${file} is neither an array nor { cards: [...] }`);
    process.exit(1);
  }

  let deckMax = 0;
  let deckWorst = null;
  for (const card of cards) {
    const text = card.type !== 'truth' && card.soften ? card.soften : card.text;
    if (typeof text !== 'string') {
      console.error(`lint-fit: ${file}/${card.id ?? '?'} has non-string text`);
      process.exit(1);
    }
    const eff = text.length + (card.speak ? String(card.speak).length * 1.6 : 0) + (card.timebox ? 40 : 0);
    total++;
    if (eff > deckMax) { deckMax = eff; deckWorst = card.id ?? '?'; }
    if (eff > CEILING) {
      offenders.push({ file, id: card.id ?? '?', eff: Math.round(eff), chars: text.length, speak: card.speak ? String(card.speak).length : 0, timer: !!card.timebox });
    }
  }
  const band = deckMax <= 80 ? 'xl' : deckMax <= 145 ? 'lg' : deckMax <= 210 ? 'md' : deckMax <= 260 ? 'sm' : 'xs';
  perDeck.push({ file, cards: cards.length, maxEff: Math.round(deckMax), band, worst: deckWorst });
}

for (const d of perDeck) {
  console.log(`lint-fit: ${d.file.padEnd(16)} ${String(d.cards).padStart(3)} cards  max eff ${String(d.maxEff).padStart(3)}  band ${d.band}  (widest ${d.worst})`);
}

if (offenders.length) {
  console.error('');
  for (const o of offenders.slice(0, 12)) {
    console.error(`lint-fit: OVER ${o.eff} (> ${CEILING}) ${o.file}/${o.id} — ${o.chars} chars + speak ${o.speak}${o.timer ? ' + timer 40' : ''}`);
  }
  if (offenders.length > 12) console.error(`lint-fit: …and ${offenders.length - 12} more`);
  console.error('');
  console.error(`Fix: trim text/speak, or drop the timer. Note ${CEILING} is the xs-band boundary:`);
  console.error('a card at 261 is in the band with the least headroom on 360x640.');
  process.exit(1);
}

const maxEff = Math.max(...perDeck.map((d) => d.maxEff));
console.log(`FIT OK — ${total} cards across ${files.length} decks, max effective length ${maxEff} <= ${CEILING} (band boundary for xs).`);