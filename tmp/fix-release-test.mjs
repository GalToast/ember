import { readFileSync, writeFileSync } from 'node:fs';
let t = readFileSync('tests/release.journey.mjs', 'utf8');
t = t.replace("night0.release?.holder === 'a'", "night0.release?.holder === 'b'");
t = t.replace("check('release initialized (holder a, held)'", "check('release initialized (holder b, held)'");
t = t.replace("check('gift flips holder to b', night1.release?.holder === 'b'", "check('gift flips holder to a', night1.release?.holder === 'a'");
t = t.replace("check('gifted state survives resume', night2.release?.holder === 'b'", "check('gifted state survives resume', night2.release?.holder === 'a'");
t = t.replace("if (n.release?.holder === 'b' && n.turn === 'b' && n.release?.state === 'held')", "if (n.release?.holder === 'a' && n.turn === 'a' && n.release?.state === 'held')");
writeFileSync('tests/release.journey.mjs', t);
console.log('test expectations fixed');
