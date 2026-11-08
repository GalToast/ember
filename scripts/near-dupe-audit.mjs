// Near-duplicate card audit — trigram similarity across ALL decks.
// Exit 1 if any pair > 0.85 (the "same card twice" feeling), warn 0.62-0.85.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const tri = (s) => { s = s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim(); const t = new Set(); for (let i = 0; i < s.length - 2; i++) t.add(s.slice(i, i + 3)); return t; };
const entries = [];
for (const f of readdirSync('content/decks').filter(f => f.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(`content/decks/${f}`, 'utf8'));
  for (const c of d.cards) entries.push({ id: c.id, deck: d.id, text: c.text, g: tri(c.text) });
}
const out = [];
for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
  const a = entries[i], b = entries[j];
  const inter = [...a.g].filter(x => b.g.has(x)).length;
  const sim = inter / Math.max(1, Math.min(a.g.size, b.g.size));
  if (sim > 0.62 && a.text !== b.text) out.push({ a: a.id, b: b.id, sim: +sim.toFixed(2) });
}
out.sort((x, y) => y.sim - x.sim);
const hard = out.filter(p => p.sim > 0.85);
console.log(`near-dupe audit: ${entries.length} cards, ${out.length} pairs >0.62, ${hard.length} pairs >0.85`);
hard.forEach(p => console.log(`  HARD ${p.sim} ${p.a} vs ${p.b}`));
writeFileSync('tmp/near-dupes.json', JSON.stringify(out, null, 2));
process.exit(hard.length ? 1 : 0);
