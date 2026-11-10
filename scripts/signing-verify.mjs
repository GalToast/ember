// Identity gate for the Ember release APK.
//
// Why this exists — measured 2026-11-10: four `assembleRelease` runs produced
// four different certificates on this box, because `$ANDROID_USER_HOME` selects
// a different debug store per value, or Gradle mints a new one at
// C:/Android/debug.keystore when the `.android` suffix is missing. All four
// built "successfully". A build plus `aapt2 dump badging` looked perfect while
// the resulting APK could not update the installed app
// (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`) silently.
//
// Certificate SHA-1 is the only identity that matters here. File name, size and
// mtime are not: the packaging layout changes between runs.
//
//   node scripts/signing-verify.mjs                                  # release APK vs declared key
//   node scripts/signing-verify.mjs --installed C:/tmp/x.apk           # installed APK vs release key
//   node scripts/signing-verify.mjs --list                            # candidate keys on this box

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { apkPath } from './apk-path-lib.mjs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const FLAG = (name) => args.indexOf(name);
const VALUE = (name, fallback) => {
  const i = FLAG(name);
  return i >= 0 ? (args[i + 1] || fallback) : fallback;
};

const listOnly = args.includes('--list');
const installedAt = FLAG('--installed') >= 0 ? VALUE('--installed') : null;
// Tests use a throwaway checkout, so allow steering the keystore dir.
const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const keystoreDir = VALUE('--keystore-dir', join(repoRoot, 'android'));
const buildTools = process.env.BUILD_TOOLS_VERSION || '36.0.0';
const USER_HOME = process.env.UserProfile || process.env.HOME || homedir();
const keytool = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'keytool.exe') : 'keytool';

// ANDROID_SDK_HOME=C:\Android is set box-wide but points at the USER_HOME dir,
// not the SDK, so trusting it produced "ENOENT apksigner". Only accept a path
// that actually holds build-tools.
function resolveSdk() {
  const candidates = [
    (() => {
      try {
        const line = readFileSync('android/local.properties', 'utf8')
          .split('\n').find((l) => l.trim().startsWith('sdk.dir='));
        return line ? line.split('=').slice(1).join('=') : null;
      } catch { return null; }
    })(),
    process.env.ANDROID_SDK_ROOT,
    join(USER_HOME, 'Android', 'Sdk'),
    process.env.ANDROID_SDK_HOME,
  ].filter(Boolean);
  return candidates.find((c) => existsSync(join(c, 'build-tools', buildTools))) || join(USER_HOME, 'Android', 'Sdk');
}
const sdk = resolveSdk();

// execFileSync cannot exec a .bat directly on Windows
// (spawnSync ... apksigner.bat EINVAL, measured 2026-11-10). It must become a
// single command LINE through cmd /c, with paths with spaces quoted INSIDE that
// line — passing the path as one argv arg makes cmd split it
// ('C:\Program Files' -> "'C:\Program' is not recognized").
function exec(cmd, argv) {
  if (process.platform === 'win32' && /\.(bat|cmd)$/i.test(cmd)) {
    const quote = (a) => (/\s/.test(a) ? `"${a}"` : a);
    const line = [cmd, ...argv].map(quote).join(' ');
    return execFileSync('cmd', ['/c', line], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, maxBuffer: 16 * 1024 * 1024,
    });
  }
  return execFileSync(cmd, argv, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, maxBuffer: 16 * 1024 * 1024,
  });
}

function apksignerCert(apk) {
  const out = exec(join(sdk, 'build-tools', buildTools, 'apksigner.bat'), ['verify', '--print-certs', apk]);
  const m = /Signer #1 certificate SHA-1 digest:\s*([0-9a-fA-F]{40})/.exec(out);
  return m ? m[1].toLowerCase() : null;
}

// keytool prints `SHA1: <hex>` with a space after the colon, so a hex-only
// character class rejects every real store. Measured, 2026-11-10.
function storeCert(store, storePassword) {
  const out = exec(keytool, ['-v', '-list', '-keystore', store,
    '-storepass', storePassword, '-keypass', storePassword]);
  const m = /\bSHA1:\s*([0-9a-fA-F][0-9a-fA-F](?::[0-9a-fA-F][0-9a-fA-F]){19})/i.exec(out);
  return m ? m[1].split(':').map((h) => h.padStart(2, '0')).join('').toLowerCase() : null;
}

function readProps(dir) {
  const file = join(dir, 'keystore.properties');
  if (!existsSync(file)) return null;
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { file, ...out };
}

function candidates() {
  const list = [];
  const push = (path, label) => { if (path && !list.some((e) => e.path === path)) list.push({ path, label }); };
  if (process.env.ANDROID_USER_HOME) {
    push(join(process.env.ANDROID_USER_HOME, '.android', 'debug.keystore'), 'ANDROID_USER_HOME/.android');
    push(join(process.env.ANDROID_USER_HOME, 'debug.keystore'), 'ANDROID_USER_HOME');
  }
  push(join(USER_HOME, '.android', 'debug.keystore'), '~/.android');
  push(join('C:', 'Android', '.android', 'debug.keystore'), 'C:/Android/.android');
  push(join('C:', 'Android', 'debug.keystore'), 'C:/Android');
  return list;
}

function report(apkCert, label, expectedCert, required) {
  const same = !expectedCert || apkCert === expectedCert;
  const matchesRequired = !required || apkCert.startsWith(required.toLowerCase());
  console.log(`${same ? 'MATCH' : 'diff '}  ${label || apkCert}`);
  return same && matchesRequired;
}

function main() {
  if (listOnly) {
    const props = readProps(keystoreDir);
    for (const s of candidates()) {
      let cert = null;
      try { cert = existsSync(s.path) ? storeCert(s.path, 'android') : null; } catch { cert = null; }
      console.log(`${cert || '(unreadable)'}  ${existsSync(s.path) ? 'present' : 'absent'}  ${s.label}`);
    }
    if (props) {
      const store = props.storeFile.startsWith('.') ? join(keystoreDir, props.storeFile) : join(keystoreDir, props.storeFile);
      let cert = null;
      try { cert = existsSync(store) ? storeCert(store, props.storePassword) : null; } catch { cert = null; }
      console.log(`${cert || '(unreadable)'}  ${existsSync(store) ? 'present' : 'absent'}  release (${props.storeFile})`);
    }
    return;
  }

  const releaseProps = readProps(keystoreDir);
  let requiredCert = null;
  let keyDetail = '';

  if (releaseProps && releaseProps.storeFile) {
    const store = join(keystoreDir, releaseProps.storeFile);
    if (!existsSync(store)) {
      console.error(`signing-verify: keystore ${store} named in ${join(keystoreDir, 'keystore.properties')} is MISSING`);
      process.exit(1);
    }
    requiredCert = storeCert(store, releaseProps.storePassword);
    if (!requiredCert) {
      console.error('signing-verify: could not read a cert from the release keystore — check storePassword.');
      process.exit(1);
    }
    keyDetail = `${releaseProps.storeFile} (alias ${releaseProps.keyAlias || '?'})`;
  } else {
    console.error('signing-verify: no android/keystore.properties — release signing is the DEBUG fallback.');
    console.error('  This APK cannot update a release install and its identity changes with each');
    console.error('  ANDROID_USER_HOME. Create keystore.properties to sign with a real key.');
    process.exit(1);
  }

  const target = installedAt || apkPath();
  if (!existsSync(target)) {
    console.error(`signing-verify: ${target} not found`);
    process.exit(1);
  }

  const actual = apksignerCert(target);
  if (!actual) {
    console.error(`signing-verify: no signer read from ${target}`);
    process.exit(1);
  }
  console.log(`signing-verify: ${target}`);
  console.log(`signing-verify: APK cert     = ${actual}`);
  console.log(`signing-verify: release cert = ${requiredCert}  [${keyDetail}]`);

  const okCert = actual === requiredCert;
  console.log(`${okCert ? 'MATCH' : 'DIFF'}  release keystore identity`);

  if (!okCert) {
    if (installedAt) {
      console.error('');
      console.error(`signature-verify: CANNOT UPGRADE — the installed app uses ${actual}`);
      console.error('  and the new release uses ' + requiredCert);
      console.error('  adb install will fail INSTALL_FAILED_UPDATE_INCOMPATIBLE (Android refuses');
      console.error('  an update signed by a different key).');
      console.error('  Owner decision required: re-sign with the installed key, or uninstall');
      console.error('  then clean-install (data loss), or require a fresh installer.');
      process.exit(2);
    }
    console.error('signing-verify: APK is not signed by the declared release keystore.');
    process.exit(1);
  }

  for (const s of candidates()) existsSync(s.path) && console.log(`note: other candidate key ${s.path}`);
  console.log('signing-verify: OK — APK matches the declared release keystore');
}

try {
  main();
} catch (err) {
  console.error(`signing-verify: ${err.message || err}`);
  process.exit(1);
}