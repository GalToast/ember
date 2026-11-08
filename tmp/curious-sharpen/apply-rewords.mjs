import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'content/decks/curious.json';
const doc = JSON.parse(readFileSync(FILE, 'utf8'));

// old text -> new text (full `text` line values as they appear in the file)
const rewords = {
  "The Try-New-Things menu: each writes three things you're curious to explore with me — one gentle, one bold, one wild card. Trade. Pick one to order this month":
    "Each writes three things: one gentle, one bold, one wild card. Trade. Pick one to do this month.",
  "Blindfold them (scarf, shirt, sleep mask). Five minutes of your undivided attention — you decide everything, gently.":
    "Blindfold them (scarf, shirt, sleep mask). Five minutes. You decide everything. Every touch, every pause.",
  "Power swap: one of you gives a single, gentle command; the other follows for three minutes. Then swap. Safe word exists and is sacred.":
    "Power swap: one command. Three minutes of obedience. Then swap. Safe word is sacred.",
  "Ice trace: run an ice cube slowly along their collarbone and neck. Your other hand is not allowed to help.":
    "Ice trace: run an ice cube slowly from collarbone to throat. Your other hand stays out of it.",
  "The tease game: whoever gives in and touches the other first loses, and grants one wish tonight. No time limit — that's the point.":
    "The tease game: first to touch loses — and owes one wish tonight. No time limit. That's the point.",
  "Take control of their evening for the next hour: pick the next two cards, the music, and how close they sit.":
    "Take control of their evening: the next two cards, the music, how close they sit. One hour.",
  "Have them close their eyes or use a soft blindfold while you introduce three different textures or temperatures across their skin.":
    "Blindfold them. Three textures or temperatures across their skin. Watch for the shiver.",
  "Take the lead for the next ten minutes: choose the pace, the touches, and the moments of pause while they simply receive.":
    "Take the lead for ten minutes: the pace, the touches, the pauses. They just receive.",
  "No-touch tease: stay close enough to feel each other's breath and describe exactly what you'd do if touching were allowed.":
    "No-touch tease: close enough to feel their breath. Describe exactly what you'd do to them if you could touch.",
  "Offer a feather, ice cube, or soft fabric and invite them to explore your skin with it however curiosity leads for one full minute.":
    "Hand them a feather, ice cube, or fabric. One minute of them tracing your skin however they like.",
  "Blindfold them gently, then narrate every soft thing you feel while they use only light texture or temperature play.":
    "Blindfold them. They play with texture and temperature on your skin. You narrate every sensation.",
  "Build a tiny sensory station with whatever is nearby (ice, fabric, feather, warm breath) and invite them to choose the order.":
    "Build a sensory station from what's nearby (ice, fabric, feather, breath). They choose the order. You deliver.",
  "Have them describe out loud one new way they'd like to be touched while you listen without acting on it yet.":
    "Have them describe one new way they want to be touched. You listen. You don't act — yet.",
  "Each builds a three-item curiosity menu — sensory, pacing, or lead/follow. Trade, then circle one you both want to explore soon.":
    "Each builds a three-item menu — sensory, pacing, lead or follow. Trade. Circle one you both want.",
  "Take turns leading for three minutes each: the leader chooses only soft sensory play (texture, temperature, breath) while the other simply receives and notices.":
    "Take turns leading three minutes each: texture, temperature, breath only. The other receives and notices.",
  "Offer a blindfolded taste test: they close their eyes while you give them three small tastes or scents to identify.":
    "Blindfold them. Three tastes or scents. They name each one.",
  "Orgasm-denial-lite tease: bring the heat up with touch or kissing for two minutes, then pause completely and hold the want.":
    "Edge-lite: touch or kiss for two minutes, then stop completely. Hold the want.",
  "Body-worship-with-words round: spend sixty seconds describing what you admire about their body while your hands stay still.":
    "Body worship with words: sixty seconds describing their body. Hands still. Every word out loud.",
  "Edging-adjacent pause: get close with touch or friction, then freeze for twenty seconds when either of you says hold.":
    "Edge pause: touch or friction until close, then freeze for twenty seconds on 'hold'.",
  "Discover massage oil or lotion together: warm it, then explore one new area of skin with slow hands for a minute.":
    "Warm oil between your hands. Drip it down a new spot. Slow hands for a minute.",
  "Whisper a short guided-self-touch instruction and let them decide whether to follow it while you watch.":
    "Whisper a self-touch instruction. They decide whether to follow while you watch.",
  "Together, each build a private yes/no/maybe list of three items each, trade lists, and discuss only one shared yes.":
    "Each builds a private yes, no, maybe list of three. Trade. Discuss one shared yes.",
  "Offer a warm-oil-drip trace: warm a little oil between your hands, then let it drip and spread slowly along a path they approve.":
    "Warm oil between your hands. Drip it along a path they approve. Spread it slow.",
  "Blindfold obedience, lite: they wear a soft blindfold while you give three simple, safe instructions to follow by touch and voice.":
    "Blindfold obedience: three simple instructions by touch and voice. They follow.",
  "Invite hands-tied-with-scarf follow-the-instructions: loosely bind their wrists with a soft scarf, then give three gentle instructions they can follow.":
    "Bind their wrists with a soft scarf. Give three instructions they follow. Loose enough to escape.",
  "Sensation menu round: silk, leather, feather, hair, teeth, nails. 2 minutes each. Rate 1-10.":
    "Sensation menu: silk, leather, feather, their hair in a fist, teeth, nails dragged slow. Two minutes each. They rate every one out loud.",
  "Service dare: bathe them. Wash hair. Soap every inch. Dry them slow. Dress them.":
    "Bathe them like they're yours: soap every inch, slow hands, kneel to wash their legs, dry pat-by-pat, then decide what they wear — nothing under it.",
};

let applied = 0;
const seen = new Set();
for (const card of doc.cards) {
  const old = rewords[card.text];
  if (old) {
    if (seen.has(old)) throw new Error(`duplicate old text: ${old}`);
    seen.add(old);
    card.text = old;
    applied++;
  }
}

// validations
if (applied !== Object.keys(rewords).length) {
  throw new Error(`expected ${Object.keys(rewords).length} rewords, applied ${applied}`);
}
const texts = doc.cards.map((c) => c.text);
const dupes = [...new Set(texts.filter((t, i) => texts.indexOf(t) !== i))];
if (dupes.length) throw new Error(`duplicate texts: ${JSON.stringify(dupes)}`);
const bad = doc.cards.filter((c) =>
  /\bmy\b/i.test(c.text) || /^I /.test(c.text) || / \/ /.test(c.text));
if (bad.length) throw new Error(`forbidden: ${bad.map((c) => c.id).join(',')}`);
const long = doc.cards.filter((c) => c.text.length > 160);
if (long.length) throw new Error(`text >160: ${long.map((c) => `${c.id}:${c.text.length}`).join(',')}`);
const speakLong = doc.cards.filter((c) => c.speak && c.speak.length > 120);
if (speakLong.length) throw new Error(`speak >120: ${speakLong.map((c) => c.id).join(',')}`);

writeFileSync(FILE, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log(`REWORDS APPLIED: ${applied} / ${doc.cards.length} cards`);
console.log('duplicate texts: none | forbidden my/I^/slash: none | text<=160: ok | speak<=120: ok');
