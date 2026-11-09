/** Run every tests/*.journey.mjs against a local preview; stop on first failure. */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync('tests').filter((f) => f.endsWith('.journey.mjs'));
let failed = 0;
for (const f of files) {
  const r = spawnSync('node', [`tests/${f}`], { stdio: 'inherit', timeout: 300000 });
  if (r.status !== 0) { console.error(`JOURNEY FAILED: ${f}`); failed++; break; }
}
console.log(failed ? `\n${failed} journey suite(s) FAILED` : `\nALL ${files.length} JOURNEY SUITES PASS`);
process.exit(failed ? 1 : 0);
