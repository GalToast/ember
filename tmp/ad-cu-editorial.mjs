import { readFileSync, writeFileSync } from 'node:fs';
const R = {
  afterdark: {
    'afterdark-009': { text: 'Tell them about the last time one look from them left you aching so badly you had to touch yourself the moment they left the room.' },
    'afterdark-025': { text: 'Straddle their face. Ride their mouth until you come. They don\'t stop. You don\'t ask. The weight is yours to give.' },
    'afterdark-079': { text: 'Alternate rounds on each other\'s mouth — ninety seconds each, and the one who comes second kisses the first through the aftershocks.' },
    'afterdark-092': { text: 'Face-sitting with a referee: two minutes each, and whoever grips the headboard first loses the next round\'s control.' },
    'afterdark-060': { text: 'Two songs, slow strip — ripping is banned. Patience is the game; whoever rushes performs one command the other names.' },
    'afterdark-075': { text: 'Bite their inner thigh hard enough to leave teeth marks — and nothing else: no hands, no mouth lower, just teeth and breath until they beg.' },
    'afterdark-063': { text: 'Name the act you\'ve never tried but touch yourself to nightly — walk me through it, every detail, and we decide if tonight is the night.' },
    'afterdark-112': { text: 'Full-length mirror, faces close: watch your OWN face while they take you apart — the reactions you never get to see. Eyes up the whole time.' },
    'afterdark-129': { text: 'Mid-fuck freeze frame: whoever says "mercy" first wins. The safeword stands outside this game — always.' },
    'afterdark-089': { text: 'Blanket on the couch, friends two feet away, movie audio hiding everything. Your fingers work under the blanket. Neither of you makes a sound.' },
    'afterdark-070': { text: 'What\'s the touch under the table at a crowded dinner party that makes you both excuse yourselves five minutes later? Recreate the look across tonight\'s table.' },
    'afterdark-061': { text: 'Talk about the kiss that meant \'I\'m fucking you tonight\' — the bite hard enough to leave a dent they kept touching afterwards.' },
    'afterdark-100': { text: 'Share the edge that isn\'t gentle — the hair pull that makes them arch, the bite that leaves a mark for days, the \'don\'t stop\' that means harder.' },
  },
  curious: {
    'curious-089': { text: 'Timed yes-chain: one ask every thirty seconds, each yes unlocking a filthier ask. Six rounds. Nobody breaks the cadence.' },
    'curious-090': { text: 'Touch-language live fire: invent three signals, then use them during a real slow session — one misread signal restarts the round.' },
    'curious-088': { text: 'Themed scavenger hunt: five things from the KITCHEN only, each tried on each other\'s skin, rated aloud, winner picks the finish.' },
    'curious-091': { text: 'Two-personas collide: each picks a character, both stay in role for three minutes — strangers, rivals, anything — while touching like you\'re not.' },
    'curious-092': { text: 'Three-person stillness, two bodies: BOTH of you stay completely still while one hand (one person\'s) teases the other — first to react loses their turn.' },
    'curious-125': { text: 'Roleplay: strangers at a wedding — open bar, borrowed suits, one room too many. Dress up if you have it. In character until the door locks.' },
    'curious-053': { text: 'Silent yes/no/maybe: each writes three of each on paper, trade, and discuss ONLY in written notes for ten minutes. Voices stay off.' },
  },
};
for (const [deck, cards] of Object.entries(R)) {
  const p = `content/decks/${deck}.json`;
  const d = JSON.parse(readFileSync(p, 'utf8'));
  for (const c of d.cards) {
    const f = cards[c.id];
    if (!f) continue;
    for (const [k, v] of Object.entries(f)) c[k] = v;
    if (c.text.length > 160) throw new Error(`${c.id} too long ${c.text.length}`);
  }
  writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
  console.log(deck, 'ok');
}
