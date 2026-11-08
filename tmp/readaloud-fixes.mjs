import { readFileSync, writeFileSync } from 'node:fs';
// Read-aloud rhythm pass: cards with 3+ sentences and 130+ chars read clunky out loud.
// Each fix keeps the mechanic, tightens to 1-2 punchy sentences. Voice stays dirty.
const R = {
  closer: {
    'closer-026': 'Wish trade: each names one wish for the other — granted this week, deferred with a date, or negotiated up. Deal like it\'s business.',
    'closer-008': 'Make one wish about us out loud. The answer is "granted this week" or "deferred" with a date. No negotiating.',
  },
  inferno: {
    'inferno-028': 'Edge them twice, stop, and make them say the exact words that earn the third. Out loud. Looking at you.',
    'inferno-117': 'Eyes-open rule: they touch you exactly how you love and you keep your eyes on theirs. Every blink adds ten seconds.',
    'inferno-009': 'How do you want to be taken over tonight — held down, ordered, used slow until you\'re shaking? Say it like an instruction.',
    'inferno-183': 'Fuck them against the window, lights on, hands on the glass — and tell them exactly who could see if they looked up.',
    'inferno-026': 'Face to face, joined, slowest round ever. Either can call a thirty-second freeze. First to cheat bottoms.',
    'inferno-035': 'Tell them what kneeling and giving ten minutes of service with zero expectation back does to you. Would you beg?',
    'inferno-027': 'What sound do they make that turns you feral? Imitate it, then say what you\'ll do the second you hear it tonight.',
    'inferno-099': 'Spank ledger: five slow spanks, each with a spoken thank you. Any sass adds one. Eye contact kept.',
    'inferno-181': 'What\'s the most depraved thing you find unbelievably hot about them? You\'re not sober tonight. Confess.',
  },
  afterdark: {
    'afterdark-093': 'Strip race. Loser bends over the bed, face down, and counts every stroke out loud while the winner decides the pace.',
  },
};
for (const [deck, cards] of Object.entries(R)) {
  const p = `content/decks/${deck}.json`;
  const d = JSON.parse(readFileSync(p, 'utf8'));
  for (const c of d.cards) {
    const f = cards[c.id];
    if (!f) continue;
    c.text = f;
    if (c.text.length > 160) throw new Error(`${c.id} too long`);
  }
  writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
}
console.log('read-aloud fixes applied:', Object.values(R).reduce((s, o) => s + Object.keys(o).length, 0));
