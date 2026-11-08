import { readFileSync } from 'node:fs';
const doc = JSON.parse(readFileSync('content/decks/curious.json', 'utf8'));
const texts = doc.cards.map((c) => c.text);
console.log('typeof non-string:', texts.filter((t) => typeof t !== 'string').length);
console.log('nulls:', texts.filter((t) => t === null).length);
console.log('undefineds:', texts.filter((t) => t === undefined).length);
const dupes = [...new Set(texts.filter((t, i) => texts.indexOf(t) !== i))];
console.log('dupes:', JSON.stringify(dupes.slice(0, 5)));
