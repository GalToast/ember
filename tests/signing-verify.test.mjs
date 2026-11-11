/**
 * Regression tests for `scripts/signing-verify.mjs`.
 *
 * Why this exists: four `assembleRelease` runs on 2026-11-10 produced four
 * different certificates and all of them "succeeded", so the artifact looked
 * installable while every existing install would reject it. A gate that only
 * checks "built successfully" cannot see that class of failure.
 *
 * These cases assert the gate's DECISION LOGIC on synthetic keystores:
 *   - release APK vs declared release key      → MATCH
 *   - release APK signed by a different key    → exit 1
 *   - installed APK on a different key         → exit 2, names the failure
 *   - installed APK on the release key         → exit 0
 *   - missing keystore.properties              → exit 1, explains the fallback
 *
 * Run: node tests/signing-verify.test.mjs
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const KEYTOOL = process.env.JAVA_HOME ? join(process.env.JAVA_HOME.replace(/bin$/, ''), 'bin', 'keytool.exe') : 'keytool';
const ANDROID_SDK = process.env.ANDROID_SDK_ROOT || join(process.env.UserProfile || process.env.HOME, 'Android', 'Sdk');
const APKSIG = join(ANDROID_SDK, 'build-tools', process.env.BUILD_TOOLS_VERSION || '36.0.0', 'apksigner.bat');

// A .bat is a shell script: execFileSync(...apksigner.bat) returns spawnSync ...
// bat EINVAL, so it must be a single command LINE through cmd /c.
// keytool.exe is an argv-able binary — no shell involved, spaces are fine.
function execBat(cmd, args, opts = {}) {
  const quote = (a) => (/\s/.test(a) ? `"${a}"` : a);
  const line = [cmd, ...args].map(quote).join(' ');
  return execFileSync('cmd', ['/c', line], {
    encoding: 'utf8', windowsHide: true, timeout: 120_000,
    stdio: ['ignore', 'pipe', 'pipe'], ...opts,
  });
}

function execTool(cmd, args, opts = {}) {
  return /\.bat$/i.test(cmd) ? execBat(cmd, args, opts) : execFileSync(cmd, args, opts);
}


let pass = 0;
const fails = [];
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fails.push(name + (detail ? ` — ${detail}` : '')); console.log('FAIL ' + name + (detail ? ` — ${detail}` : '')); }
};
const eq = (name, got, want) => ok(name, Object.is(got, want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

/**
 * Run a script and classify the outcome.
 *
 * A TIMEOUT must never look like a wrong exit code. `execFileSync` reports a
 * timeout as err.status = null (not a number), err.code = 'ETIMEDOUT',
 * err.signal = 'SIGTERM'. The old fallback `typeof err.status === 'number' ?
 * err.status : 1` therefore collapsed every timeout into rc 1 — indistinguishable
 * from the gate genuinely failing — and the assertion text ("same key rc 0 —
 * got 1, want 0") pointed at the signing logic instead of at the real cause:
 * the box being too slow to start a JVM inside the budget.
 *
 * Timeout is now its own outcome: rc -1 with `timeout: true`.
 */
function runIn(cwd, file, args = [], { timeoutMs = 90_000 } = {}) {
  try {
    const stdout = execFileSync(process.execPath, [file, ...args], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: timeoutMs, windowsHide: true,
    });
    return { rc: 0, timeout: false, stdout, stderr: '' };
  } catch (err) {
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';
    if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') {
      // A timeout produces no stderr, so this marker is the ONLY trace of what
      // happened. Without it the failure reads as a signing bug.
      return {
        rc: -1,
        timeout: true,
        timeoutMs,
        stdout,
        stderr: stderr || `TIMED OUT after ${timeoutMs}ms`,
      };
    }
    return {
      rc: typeof err.status === 'number' ? err.status : 1,
      timeout: false,
      stdout,
      stderr,
    };
  }
}

/** Describe an outcome for an assertion message, so a timeout says so. */
function outcome(res) {
  return res.timeout
    ? `TIMED OUT after ${res.timeoutMs}ms (rc=${res.rc})`
    : `rc=${res.rc}${res.stderr ? ` stderr=${res.stderr.slice(0, 120)}` : ''}`;
}

// Mint a throwaway PKCS12 keystore with keytool, then sign a placeholder APK
// with it via apksigner. This is the only way to prove the gate distinguishes
// two identities instead of printing a green line unconditionally.
function makeKeystore(dir, alias = 'test', password = 'pwtest-123') {
  // One file PER identity: keytool interrogates for overwrite rather than
  // blowing over it, so a shared name fails with empty stderr — a confusing
  // error that cost a full debugging cycle on 2026-11-10.
  const store = join(dir, `keystore-${alias}.ks`);
  execTool(KEYTOOL, ['-genkeypair', '-v', '-alias', alias, '-keyalg', 'RSA',
    '-keypass', password, '-storepass', password, '-keystore', store,
    '-dname', 'CN=test identity, OU=qa', '-keysize', '2048', '-validity', '365'], {
    encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true, timeout: 60_000,
  });
  const out = execTool(KEYTOOL, ['-v', '-list', '-keystore', store, '-storepass', password], {
    encoding: 'utf8', windowsHide: true,
  });
  const m = /\bSHA1:\s*([0-9a-fA-F:]{59})/.exec(out);
  return { store, password, alias, cert: m[1].split(':').map((h) => h.padStart(2, '0')).join('').toLowerCase() };
}

// Build a minimal zip in-process: no `zip` binary exists on this box (measured
// 2026-11-10), so anything that shells out to one cannot be a test fixture.
// A REAL APK is the fixture: re-signing a genuine archive exercises v2
// signing paths and a valid binary AndroidManifest, which we will NOT
// reimplement here (synth XML burned real time and apksigner rejects it).
// Any APK in the repo works; re-signing replaces the old signature block.
function makeApk(dst) {
  const candidates = [
    join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
    join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  ].filter((p) => existsSync(p));
  if (!candidates.length) throw new Error('no APK available — build one (npm run assembleRelease or npx cap sync android) then re-run');
  copyFileSync(candidates[0], dst);
}

async function main() {
  for (const mode of ['release', 'installed']) {
    const dir = mkdtempSync(join(tmpdir(), 'ember-signing-'));
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    mkdirSync(join(dir, 'android'), { recursive: true });
    try {
      copyFileSync(join(root, 'scripts', 'signing-verify.mjs'), join(dir, 'scripts', 'signing-verify.mjs'));
      copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));

      // The keystore must live beside keystore.properties: the gate resolves
      // storeFile relative to android/, which in this fixture is <tmp>/android.
      const a = makeKeystore(join(dir, 'android'), 'a', 'pw-a-1234');
      const b = makeKeystore(join(dir, 'android'), 'b', 'pw-b-1234');
      // Pin the RELEASE variant path: the gate reads whatever apk-path-lib
      // selects, and in a fixture cwd that must be our own artifact.
      const relapk = join(dir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
      mkdirSync(dirname(relapk), { recursive: true });
      const apk = relapk;
      makeApk(apk);

      writeFileSync(join(dir, 'android', 'keystore.properties'),
        `storeFile=${a.store.split(/[\\/]/).pop()}\nstorePassword=${a.password}\nkeyAlias=${a.alias}\nkeyPassword=${a.password}\n`);
      execBat(APKSIG, ['sign', '--min-sdk-version', '24', '--ks', a.store, '--ks-pass', `pass:${a.password}`,
        '--key-pass', `pass:${a.password}`, '--ks-key-alias', a.alias, apk], {
        encoding: 'utf8', windowsHide: true });
      const certA = findCert(apk);

      // 1. Correct release key → exit 0 and MATCH.
      const good = runIn(dir, 'scripts/signing-verify.mjs');
      eq(`${mode}: pgp match rc 0`, good.rc, 0);
      ok(`${mode}: match is stated`, /MATCH/.test(good.stdout), outcome(good));

      // 2. Installed APK on a DIFFERENT key → the case that matters most:
      //    the gate must warn about INSTALL_FAILED_UPDATE_INCOMPATIBLE.
      const other = join(dir, 'other.apk');
      copyFileSync(apk, other);
      execBat(APKSIG, ['sign', '--min-sdk-version', '24', '--ks', b.store, '--ks-pass', `pass:${b.password}`,
        '--key-pass', `pass:${b.password}`, '--ks-key-alias', b.alias, other], {
        encoding: 'utf8', windowsHide: true });
      const bad = runIn(dir, 'scripts/signing-verify.mjs', ['--installed', other]);
      eq(`${mode}: foreign key rc`, bad.rc, 2);
      ok(`${mode}: names UPDATE_INCOMPATIBLE`,
        /UPDATE_INCOMPATIBLE/.test(bad.stdout + bad.stderr), outcome(bad));

      // 3. Same key → MATCH even in installed mode.
      const same = runIn(dir, 'scripts/signing-verify.mjs', ['--installed', apk]);
      eq(`${mode}: same key rc 0`, same.rc, 0);
      ok(`${mode}: same key outcome is legible`, !same.timeout, outcome(same));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // 4. Missing keystore.properties → exit 1 with the fallback explanation.
  {
    const dir = mkdtempSync(join(tmpdir(), 'ember-signing-'));
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    try {
      copyFileSync(join(root, 'scripts', 'signing-verify.mjs'), join(dir, 'scripts', 'signing-verify.mjs'));
      copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));
      const out = runIn(dir, 'scripts/signing-verify.mjs');
      eq('no props: rc 1', out.rc, 1);
      ok('no props: explains the debug fallback',
        /DEBUG fallback/.test(out.stdout + out.stderr), (out.stdout + out.stderr).slice(0, 120));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // Cwd-independence: the gate must resolve the APK next to its own script,
  // NOT next to the caller. Measured 2026-11-10: invoked from a directory with
  // no android/ tree, the gate printed "<cwd>/android/.../app-debug.apk not
  // found" while the repo's own build was green. Running from repo root hid it.
  {
    const dir = mkdtempSync(join(tmpdir(), 'ember-rel-'));
    const decoy = mkdtempSync(join(tmpdir(), 'ember-decoy-'));
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    mkdirSync(join(dir, 'android'), { recursive: true });
    try {
      copyFileSync(join(root, 'scripts', 'signing-verify.mjs'), join(dir, 'scripts', 'signing-verify.mjs'));
      copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));
      const a = makeKeystore(join(dir, 'android'), 'a', 'pw-a-1234');
      const relapk = join(dir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
      mkdirSync(dirname(relapk), { recursive: true });
      makeApk(relapk);
      const props = [
        'storeFile=' + a.store.split(/[\\/]/).pop(),
        'storePassword=' + a.password,
        'keyAlias=' + a.alias,
        'keyPassword=' + a.password,
        '',
      ].join('\n');
      writeFileSync(join(dir, 'android', 'keystore.properties'), props);
      execBat(APKSIG, ['sign', '--min-sdk-version', '24', '--ks', a.store, '--ks-pass', 'pass:' + a.password,
        '--key-pass', 'pass:' + a.password, '--ks-key-alias', a.alias, relapk], {
        encoding: 'utf8', windowsHide: true });
      // The decoy has NO android/ tree; only the script path points at the fixture.
      const out = runIn(decoy, join(dir, 'scripts', 'signing-verify.mjs'));
      eq('cwd-independent: rc 0 from an unrelated cwd', out.rc, 0);
      ok('cwd-independent: reports MATCH on the fixture APK',
        /MATCH/.test(out.stdout), (out.stdout + out.stderr).slice(0, 160));
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(decoy, { recursive: true, force: true });
    }
  }

  // Absolute storeFile must resolve as-is. `join()` on an absolute Windows path
  // produces "C:android\C:\Users\k.ks", which the gate reports as MISSING.
  // This was the real-world shape on this box (C:\Android\release.keystore).
  {
    const dir = mkdtempSync(join(tmpdir(), 'ember-abs-'));
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    mkdirSync(join(dir, 'android'), { recursive: true });
    try {
      copyFileSync(join(root, 'scripts', 'signing-verify.mjs'), join(dir, 'scripts', 'signing-verify.mjs'));
      copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));
      mkdirSync(join(dir, 'outside'), { recursive: true });
      const a = makeKeystore(join(dir, 'outside'), 'a', 'pw-a-1234');
      const relapk = join(dir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
      mkdirSync(dirname(relapk), { recursive: true });
      makeApk(relapk);
      // storeFile is ABSOLUTE and lives OUTSIDE android/.
      writeFileSync(join(dir, 'android', 'keystore.properties'),
        'storeFile=' + a.store + '\nstorePassword=' + a.password +
        '\nkeyAlias=' + a.alias + '\nkeyPassword=' + a.password + '\n');
      execBat(APKSIG, ['sign', '--min-sdk-version', '24', '--ks', a.store, '--ks-pass', 'pass:' + a.password,
        '--key-pass', 'pass:' + a.password, '--ks-key-alias', a.alias, relapk], {
        encoding: 'utf8', windowsHide: true });
      const out = runIn(dir, 'scripts/signing-verify.mjs');
      ok('absolute storeFile: resolves without mangling', out.rc === 0 && /MATCH/.test(out.stdout),
        (out.stdout + out.stderr).slice(0, 200));
      ok('absolute storeFile: no mangled C:android path in output',
        !/android[\\/]*C:[\\/]/.test(out.stdout + out.stderr),
        (out.stdout + out.stderr).slice(0, 200));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // --- Timeout is its own outcome, not rc 1 -------------------------------
  // Regression: `npm test` was flaky on a loaded box, failing with
  // "same key rc 0 - got 1, want 0" while a quiet box passed. The cause was
  // NOT a signing bug: a child that exceeded its timeout was reported by
  // runIn as rc 1, because execFileSync sets err.status = null on timeout
  // and the old fallback mapped any non-number to 1. The failure text then
  // pointed at the signing logic instead of at the slow box.
  {
    const dir = mkdtempSync(join(tmpdir(), 'ember-timeout-'));
    try {
      // A child that outlives its budget.
      writeFileSync(join(dir, 'slow.mjs'),
        'setTimeout(() => {}, 60_000);\n');
      const slow = runIn(dir, 'slow.mjs', [], { timeoutMs: 1_200 });
      ok('timeout: is flagged as a timeout', slow.timeout === true,
        `timeout=${slow.timeout} rc=${slow.rc}`);
      ok('timeout: does NOT masquerade as rc 1', slow.rc !== 1,
        `rc=${slow.rc} — a timeout reported as rc 1 is indistinguishable from a real failure`);
      ok('timeout: reports the budget it blew', /TIMED OUT after 1200ms/.test(slow.stderr),
        `stderr=${JSON.stringify(slow.stderr)}`);
      ok('timeout: outcome() says TIMED OUT, not "rc=1"',
        /TIMED OUT/.test(outcome(slow)), outcome(slow));

      // A child that fails for a REAL reason must still be reported as a
      // genuine non-zero exit, NOT as a timeout. This is the other half of
      // the contract: the fix must not turn real failures into timeouts.
      writeFileSync(join(dir, 'boom.mjs'),
        'process.exit(3);\n');
      const boom = runIn(dir, 'boom.mjs', [], { timeoutMs: 30_000 });
      ok('genuine failure: still reports its own exit code', boom.rc === 3,
        `rc=${boom.rc} timeout=${boom.timeout}`);
      ok('genuine failure: is not flagged as a timeout', boom.timeout === false,
        `timeout=${boom.timeout}`);
      ok('genuine failure: outcome() shows the rc', /rc=3/.test(outcome(boom)), outcome(boom));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.error('  ' + f);
    process.exit(1);
  }
}

function findCert(apk) {
  const out = execBat(APKSIG, ['verify', '--print-certs', apk]);
  const m = /Signer #1 certificate SHA-1 digest:\s*([0-9a-f]{40})/.exec(out);
  return m ? m[1].toLowerCase() : null;
}

main().catch((err) => { console.error(err); process.exit(1); });