// Guard: the APK must contain the bundle that dist/index.html points at.
//
// Why this exists — measured 2026-11-07: `npx cap sync` copies what is currently
// in dist/ into android/app/src/main/assets/public. Run it *before* a rebuild and
// it copies the previous bundle, then the rebuild replaces dist/ with a new hash.
// The APK now points at an asset that is not in it → app installed, entry HTML
// loads, but every asset 404s in a blank screen. Nothing in the toolchain errors.
//
//   node scripts/verify-apk.mjs             # compares dist/ to the installed-or-built APK
//   node scripts/verify-apk.mjs --staging   # compare against android/app/src/main/assets/public only
//
// Exit 0 = in sync. Exit 1 = stale, with the exact rebuild/sync/install order.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
const indexPath = join(distDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`verify-apk: ${indexPath} missing — run \`npm run build\` first.`);
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf8');
const refs = [...html.matchAll(/assets\/(index-[A-Za-z0-9_-]+\.(?:js|css))/g)].map((m) => m[1]);
if (refs.length === 0) {
  console.error(`verify-apk: dist/index.html references no hashed assets (css/js).`);
  process.exit(1);
}

const staging = process.argv.includes('--staging');
const apkPath = join(
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk',
);

// APK is a zip; the platform has unzip, so read the central directory via a
// small helper instead of pulling in a dependency.
function crcParse(buf) {
  const entries = new Map();
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (buf.readUInt32LE(i) !== 0x02014b50) continue;
    const nameLen = buf.readUInt16LE(i + 28);
    const extraLen = buf.readUInt16LE(i + 30);
    const commentLen = buf.readUInt16LE(i + 32);
    const method = buf.readUInt16LE(i + 10);
    const compressedSize = buf.readUInt32LE(i + 20);
    const name = buf.toString('utf8', i + 46, i + 46 + nameLen);
    // local header offset
    const localOff = buf.readUInt32LE(i + 42);
    const localNameLen = buf.readUInt16LE(localOff + 26);
    const localExtraLen = buf.readUInt16LE(localOff + 28);
    entries.set(name, { method, compressedSize, dataOff: localOff + 30 + localNameLen + localExtraLen });
  }
  return entries;
}

const distAssets = new Set(readdirSync(join(distDir, 'assets')));
const problems = [];
const lines = [];

if (staging) {
  const root = join('android', 'app', 'src', 'main', 'assets', 'public');
  for (const ref of refs) {
    const has = existsSync(join(root, 'assets', ref));
    (has ? lines : problems).push(`staging assets/${ref}: ${has ? 'present' : 'MISSING'}`);
  }
  // Only bundle assets (index-*.js/css) can prove a sync/rebuild race. Fonts
  // and images are referenced from CSS/JS, not index.html, so they would
  // always look "unreferenced" here and swamp the signal.
  for (const ref of distAssets) {
    if (!/^index-[A-Za-z0-9_-]+\.(?:js|css)$/.test(ref)) continue;
    if (refs.includes(ref)) continue;
    problems.push(`staging has stale bundle ${ref} not referenced by dist/index.html`);
  }
} else if (existsSync(apkPath)) {
  const buf = readFileSync(apkPath);
  if (buf.toString('utf8', 0, 2) !== 'PK') {
    console.error(`verify-apk: ${apkPath} is not a zip/APK.`);
    process.exit(1);
  }
  const entries = crcParse(buf);
  for (const ref of refs) {
    const name = `assets/public/assets/${ref}`;
    const e = entries.get(name);
    if (!e) {
      problems.push(`APK is missing ${name}`);
      continue;
    }
    if (e.method === 0) {
      lines.push(`APK ${name}: stored (${e.compressedSize} B)`);
    } else {
      lines.push(`APK ${name}: deflate (${e.compressedSize} B)`);
    }
  }
  // Any stale index-*.js in the APK that the HTML no longer references is a
  // sign of a cap sync that raced a rebuild; harmless but report it.
  for (const name of entries.keys()) {
    if (!name.startsWith('assets/public/assets/index-')) continue;
    if (refs.includes(name.replace('assets/public/assets/', ''))) continue;
    lines.push(`note: APK also carries unreferenced ${name}`);
  }
} else {
  console.log(`verify-apk: no APK at ${apkPath} — skipping (build one with \`npx cap sync android\` + \`npx cap open android\`).`);
  process.exit(0);
}

for (const line of lines) console.log(line);
if (problems.length) {
  for (const p of problems) console.error(`verify-apk: ${p}`);
  console.error('');
  console.error('Order that fixes it:');
  console.error('  npm run build');
  console.error('  npx cap sync android');
  console.error('  # rebuild the APK from the synced app now in android/');
  process.exit(1);
}
console.log(`verify-apk: OK — ${refs.length} assets present in sync (${staging ? 'staging only' : 'APK'}).`);