import { readFileSync, writeFileSync } from 'node:fs';
const R = {
"inferno-018": "Pin them against the nearest wall and kiss them until their knees give — wrists held, other hand wherever you want. They don't get to touch back yet.",
"inferno-025": "Take their hand and show them exactly how you want it — pace, pressure, spot — then keep it there and make them keep going until you say stop.",
"inferno-026": "Face to face, joined, slowest round ever — no speeding up no matter how good it gets. Either can call a thirty-second freeze. First to cheat bottoms.",
"inferno-047": "Voice-only: scarf around your eyes, their hands nowhere — beg with words alone, describing what you want done to you before they'll touch you.",
"inferno-049": "Countdown tease: edge them, then make them hold still while you count down from fifteen — at one, decide whether they finish or keep waiting.",
"inferno-051": "Ten-minute ownership window: one is the owner, one the willing property — used, praised, ordered. Swap at the mark if you both want more.",
"inferno-083": "Teacher-and-first-timer frame, twelve minutes: one instructs, one serves — permission asked out loud, thanks given after every order.",
"inferno-084": "Voice control, six minutes: only the sounds they call for — moan on command, hold silence, count, beg in their tone. Anything else costs a spank.",
"inferno-091": "Ownership kit, ten minutes: one collar, one scent mark, one restricted room, one sealed note — each formalized with a spoken rule, accepted out loud.",
"inferno-096": "Greedy-hands rule: they touch you everywhere at once for ninety seconds — you don't touch back. Arch, grip the sheets, take it.",
"inferno-105": "Praise under stimulation: touch them slowly while telling them in filthy detail what their body is doing to your self-control. Don't stop either.",
"inferno-109": "Wax patience: drip low-temp wax across their back — one line at a time, peeled and kissed between rounds. They hold still and count drips out loud.",
"inferno-110": "Rope patience: bind their wrists in front with a soft scarf — then one hundred seconds of kisses only, nowhere near where they're aching.",
"inferno-125": "Kitchen-counter claim: lift them onto the counter, stand between their legs, kiss them until the cold surface is the only thing holding them up.",
"inferno-128": "Yes/no/maybe extreme: each write ten boundary-pushing acts, trade papers, mark yes/no/maybe. All maybes get discussed tonight.",
"inferno-129": "Position gauntlet: three positions, three minutes each, no repeats — receiver picks. Rate them out loud; the winner joins the permanent rotation.",
"inferno-138": "Count their edges: hold them at the line as many times as you can in five minutes — counting each out loud, since they'll be too wrecked to count.",
"inferno-139": "Silent round: whatever they do to you for three minutes — no sound at all. Every moan leaks a forfeit. Your face does all the talking.",
"inferno-141": "Needy switch: they take you how they want for five minutes — but every thirty seconds you say 'please don't stop' like you mean it.",
"inferno-142": "Synchronized ruin: hands on each other, matching stroke for stroke — whoever finishes first sets up the other's round two exactly how they like it.",
"inferno-144": "Undivided attention: they do nothing for three minutes — no reciprocating — while you adore every inch of them and refuse to be thanked.",
"inferno-150": "Plan tonight's encore: the one act you both want waiting at the end of this game — filthiest details welcome, executed the moment the deck goes dark."
};
for (const n of [1,2,3]) {
  const p = 'tmp/inferno-v2-'+n+'.json';
  const arr = JSON.parse(readFileSync(p,'utf8'));
  for (const c of arr) if (R[c.id]) c.text = R[c.id];
  writeFileSync(p, JSON.stringify(arr,null,2)+'\n');
}
console.log('patched');
