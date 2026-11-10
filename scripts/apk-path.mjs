// Print the path the APK you actually install will be.
//
// Why: README's install step hard-coded android/.../debug/app-debug.apk, which
// produced a debuggable install and left the release artifact unchecked.
// Measured 2026-11-09: release was assembled 20:03 carrying the current
// dist/index.html bundle while debug sat stale at 19:48 (bundle CaHqI_Ad /
// xp84PS-B) — the repo's verify-apk.mjs checked that stale debug APK and
// reported "missing index-xu-8vJth.js" on a perfectly valid release build.
//
// Invariant: verify-apk.mjs checks the SAME artifact this script prints, so a
// green gate means the file you install is the file you verified.
//
//   node scripts/apk-path.mjs            # release if it exists, else debug
//   node scripts/apk-path.mjs --check    # exit 1 if no variant exists, print mtime

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { pickVariantStat, DEBUG_APK } from './apk-path-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { path, variant, stat, alternative } = pickVariantStat();

if (!stat) {
  console.error('apk-path: no APK under android/app/build/outputs/apk/{release,debug} — build one first.');
  process.exit(process.argv.includes('--check') ? 1 : 0);
}

console.log(path);
if (alternative && existsSync(alternative)) {
  console.error(`apk-path: note: ${alternative} also exists (debug variant)`);
}
if (process.argv.includes('--check')) {
  if (existsSync(path)) {
    console.error(`apk-path --check: ok variant=${variant} mtime=${stat.mtimeMs}`);
    process.exit(0);
  }
  console.error('apk-path --check: selected artifact missing');
  process.exit(1);
}

void root;
void variant;
void DEBUG_APK;