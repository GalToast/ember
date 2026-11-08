import { readFileSync, writeFileSync } from 'node:fs';
const R = {
"inferno-165": "Mirror filth: joined in front of the mirror while one narrates exactly what the reflection shows — faces, grips, where you disappear into each other.",
"inferno-177": "The interview: they audition on their knees to be yours tonight — answering every question about what they're good at, in detail, while you watch.",
"inferno-178": "Owned for the next hour: they wear what you pick (or nothing), sit where you put them, and speak only when asked a direct question. Check in at the half hour.",
"inferno-185": "Breathless countdown: whoever is closest to the edge at sixty seconds gets finished; the other watches, hands behind back, narrating what they see.",
"inferno-191": "Same words, different mouths: one shared phrase picked at the start — 'use me' — whoever breaks and says it first, the other makes true, immediately.",
"inferno-193": "Whole-night stake: rock-paper-scissors winner owns the rest of the night — every pace, position, finish — and the loser says 'yes' to each new rule.",
"inferno-194": "When was the last time you thought about this game mid-act — and what did you want the app to dare you both next? Say the dare you wanted.",
"inferno-197": "The long goodbye: one hour before anyone finishes — edging, teasing, positions changing — and every ten minutes each names what you're saving up for.",
"inferno-198": "Describe the exact moment tonight you want to remember in a week — where their body is, what sound they make, what you say — then go make it real.",
"inferno-200": "Plan the encore while you recover: the filthiest fifteen minutes tonight unlocked — scheduled before the night ends, no vetoes."
};
// timebox fixes: 3600 over cap -> remove (untimed scenario) or cap at 1500
const TB = { 'inferno-178': 1500, 'inferno-197': 1500 };
for (const n of [1,2]) {
  const p = 'tmp/inferno-v3-'+n+'.json';
  const arr = JSON.parse(readFileSync(p,'utf8'));
  for (const c of arr) { if (R[c.id]) c.text = R[c.id]; if (TB[c.id]) c.timebox = TB[c.id]; }
  writeFileSync(p, JSON.stringify(arr,null,2)+'\n');
}
console.log('patched');
