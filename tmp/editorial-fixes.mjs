import { readFileSync, writeFileSync } from 'node:fs';
const R = {
  spark: {
    // sense bug: holder hides AND finds? restore the correct referent (holder hides, partner seeks)
    'spark-087': { text: 'Hide a short handwritten note somewhere in the room. They get two minutes to find it — write a second one if they fail.' },
    // conceptual dupes
    'spark-066': { text: 'Pet-name draft day: each nominates two, the other votes, and the winner becomes official vocabulary for a month.' },
    'spark-093': { text: 'Build a four-step secret handshake ending in something ridiculous — jazz hands, finger guns, your choice — then perform it for no one.' },
    'spark-063': { text: 'Design each other\'s superhero ENTRY: the walk, the pose, the one-liner. Perform both. Judge brutally.' },
  },
  closer: {
    // wish triplicate -> differentiate angles
    'closer-026': { text: 'Wish trade: each names one wish for the other (not the relationship). The other answers granted-this-week, deferred-with-a-date, or negotiates up. Deal_allowed.' },
    'closer-030': { text: 'Wish ledger: each grants one old wish you know the other has been carrying — no asking, just deliver it.' },
    // listen-first triplicate
    'closer-031': { text: 'Ninety seconds of uninterrupted airtime each. The listener writes one word on their palm as their only response, then shows it.' },
    'closer-060': { text: 'Attention swap: sixty seconds each where the SPEAKER must only ask questions about the listener, who answers freely.' },
    // want-menu dupe
    'closer-029': { text: 'Build the week\'s small-joys list: three things that would make next week feel lighter. Trade lists and secretly deliver one item by Friday.' },
    // ask-and-reflect dupe
    'closer-054': { text: 'Interview each other about the week ahead, then predict each other\'s biggest friction point. Score the predictions on Sunday.' },
    // invisible-labor dupe
    'closer-059': { text: 'Name the one task you silently dread that they always end up doing. Trade tasks for this week.' },
    // redo dupe
    'closer-093': { text: 'The rewrite round: each picks one sentence from any argument this month and says what you WISH you\'d said instead. The other just nods.' },
    // shared speak line with closer-056
    'closer-089': { text: 'Reveal one secret dream in a single clear sentence and let them simply hold it with you.', speak: 'This one is real, so be gentle with it.' },
  },
  slowburn: {
    // 024 == 034 exact dupe (breathing + foreheads)
    'slowburn-034': { text: 'Foreheads together, eyes closed: ninety seconds where the only rule is neither of you pulls away first.' },
    // 063 == 094 massage dupe
    'slowburn-094': { text: 'Lotion ritual: warm it in your hands first, announce where you\'re starting, and let them pick the next spot after each round.' },
    // 051 == 089 hair dupe + identical speak
    'slowburn-089': { text: 'Ask out loud for their hair: fingers, brush, or whatever they hand you. They instruct; you obey for the full minute.' },
  },
};
for (const [deck, cards] of Object.entries(R)) {
  const p = `content/decks/${deck}.json`;
  const d = JSON.parse(readFileSync(p, 'utf8'));
  for (const c of d.cards) {
    const f = cards[c.id];
    if (!f) continue;
    for (const [k, v] of Object.entries(f)) c[k] = v;
    if (c.text.length > 160) throw new Error(`${c.id} text too long: ${c.text.length}`);
  }
  writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
  console.log(deck, 'fixed');
}
console.log('editorial fixes applied');
