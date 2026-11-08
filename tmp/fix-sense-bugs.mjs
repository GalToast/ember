import { readFileSync, writeFileSync } from 'node:fs';
const FIX = {
  'afterdark': {
    'afterdark-127': {
      text: 'Describe the exact moment tonight you knew you wanted them — the second it hit you, where you were, what they did.',
      speak: 'Paint the scene. I want to live in it.',
      soften: 'What is the first thing you noticed about them that made you want them?',
    },
  },
  'curious': {
    'curious-042': {
      text: 'Their hands, your voice: one full minute where they touch you only where and how you tell them to. No moving their hand for them.',
      speak: 'Tell me exactly where to put my hands next.',
      soften: 'Ask for one place you want their hands and let them follow it.',
    },
    'curious-079': {
      text: 'Blindfold obedience, lite: they wear a soft blindfold while you give three simple, safe instructions to follow by touch and voice.',
      speak: 'Trust my voice. One step at a time.',
      soften: 'Give one simple guided instruction without a blindfold.',
    },
    'curious-140': {
      text: 'Filthy mouth, consensual: pour the dirtiest praise over them — "so desperate for me", "look at you" — only if you have both agreed it is allowed.',
      speak: 'So needy for me. It is a beautiful thing.',
      soften: 'Whisper "you are mine" and "so good" on repeat. No degradation words.',
    },
  },
  'inferno': {
    'inferno-024': {
      text: 'When you touch yourself thinking about them — what are they doing to you in the fantasy? No cleaning it up. Give the director\'s cut.',
      soften: null,
    },
    'inferno-140': {
      text: 'Worship the part of them they hide: the one spot they are shy about. Slow mouth, slow hands, and praise until they believe every word.',
      speak: 'This part of you drives me out of my mind. Let me prove it.',
      soften: 'One sincere compliment about the part of them they are shy about.',
    },
    'inferno-148': {
      text: 'Write their lines for them: what gets said to you at the exact moment you come — the words, the voice, the whole sentence. They perform it tonight.',
      soften: null,
    },
    'inferno-149': {
      text: 'Whose desperate face is better? Describe exactly what theirs looks like when you have taken them apart — and what yours looks like when they take you.',
      soften: null,
    },
  },
};
for (const [deck, cards] of Object.entries(FIX)) {
  const p = `content/decks/${deck}.json`;
  const d = JSON.parse(readFileSync(p, 'utf8'));
  let n = 0;
  for (const c of d.cards) {
    const f = cards[c.id];
    if (!f) continue;
    for (const [k, v] of Object.entries(f)) {
      if (v === null) delete c[k];
      else c[k] = v;
    }
    if (c.text.length > 160) throw new Error(`${c.id} too long ${c.text.length}`);
    if (c.speak && c.speak.length > 120) throw new Error(`${c.id} speak too long`);
    n++;
  }
  writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
  console.log(deck, 'fixed', n);
}
