/**
 * Regression tests for the APK selector (`scripts/apk-path.mjs`) and the
 * "no APK" half of `scripts/verify-apk.mjs`.
 *
 * Why this exists: on 2026-11-09 the repo's own gate hard-coded
 * `apk/debug/app-debug.apk`, so it verified a *stale debug* artifact after a
 * release build and reported "missing index-xu-8vJth.js" on a valid release
 * APK. The installer and the verifier must resolve to the same file, and a
 * missing artifact must fail loudly — never print a green summary.
 *
 * Run: node tests/apk-path.test.mjs
 */
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let pass = 0;
const fails = [];

function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fails.push(name + (detail ? ` — ${detail}` : '')); console.log('FAIL ' + name + (detail ? ` — ${detail}` : '')); }
}

function eq(name, got, want) {
  ok(name, Object.is(got, want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

// Run a script from a throwaway cwd so the artifact tree under test is ours.
function runIn(cwd, file, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [file, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
    });
    return { rc: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      rc: typeof err.status === 'number' ? err.status : 1,
      stdout: err.stdout || '',
      stderr: err.stderr || String(err.message || err),
    };
  }
}

const cases = {
  releaseOnly: {
    release: 'android/app/build/outputs/apk/release/app-release.apk',
    debug: null,
  },
  both: {
    release: 'android/app/build/outputs/apk/release/app-release.apk',
    debug: 'android/app/build/outputs/apk/debug/app-debug.apk',
  },
  debugOnly: {
    release: null,
    debug: 'android/app/build/outputs/apk/debug/app-debug.apk',
  },
};

function materialize(spec) {
  const dir = mkdtempSync(join(tmpdir(), 'ember-apkpath-'));
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  copyFileSync(join(root, 'scripts', 'apk-path.mjs'), join(dir, 'scripts', 'apk-path.mjs'));
  copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));
  for (const rel of ['release', 'debug']) {
    if (spec[rel]) {
      const file = join(dir, spec[rel]);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, 'not really an apk\n');
    }
  }
  return dir;
}

async function main() {
  // 1. Release present, debug absent → release path, --check green.
  {
    const dir = materialize(cases.releaseOnly);
    const out = runIn(dir, 'scripts/apk-path.mjs');
    eq('release-only: prints release path', out.stdout.trim(), 'android\\app\\build\\outputs\\apk\\release\\app-release.apk');
    eq('release-only: rc 0', out.rc, 0);
    const check = runIn(dir, 'scripts/apk-path.mjs', ['--check']);
    eq('release-only: --check rc 0', check.rc, 0);
    rmSync(dir, { recursive: true, force: true });
  }

  // 2. Both variants present → release wins even if debug is newer.
  {
    const dir = materialize(cases.both);
    const debugPath = join(dir, cases.both.debug);
    writeFileSync(debugPath, 'newer debug artifact\n');
    const out = runIn(dir, 'scripts/apk-path.mjs');
    eq('both: release wins over a newer debug',
      out.stdout.trim(), 'android\\app\\build\\outputs\\apk\\release\\app-release.apk');
    eq('both: rc 0', out.rc, 0);
    rmSync(dir, { recursive: true, force: true });
  }

  // 3. Only debug → debug path, --check green (fallback still usable).
  {
    const dir = materialize(cases.debugOnly);
    const out = runIn(dir, 'scripts/apk-path.mjs');
    eq('debug-only: prints debug path',
      out.stdout.trim(), 'android\\app\\build\\outputs\\apk\\debug\\app-debug.apk');
    eq('debug-only: rc 0', out.rc, 0);
    const check = runIn(dir, 'scripts/apk-path.mjs', ['--check']);
    eq('debug-only: --check rc 0', check.rc, 0);
    rmSync(dir, { recursive: true, force: true });
  }

  // 4. No variants → rc 1, and the message names the missing cause.
  {
    const dir = mkdtempSync(join(tmpdir(), 'ember-apkpath-'));
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    copyFileSync(join(root, 'scripts', 'apk-path.mjs'), join(dir, 'scripts', 'apk-path.mjs'));
  copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));
    const plain = runIn(dir, 'scripts/apk-path.mjs');
    eq('none: rc 0 without --check (non-asserting use)', plain.rc, 0);
    const check = runIn(dir, 'scripts/apk-path.mjs', ['--check']);
    eq('none: --check rc 1', check.rc, 1);
    ok('none: message names the build step',
      /no APK/.test(check.stderr), check.stderr.trim());
    rmSync(dir, { recursive: true, force: true });
  }

  // 5. The gate must fail when no APK exists, after dist/index.html is present.
  //    Position: a green summary with no artifact to inspect is a silent hole.
  {
    const dir = mkdtempSync(join(tmpdir(), 'ember-apkpath-'));
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    copyFileSync(join(root, 'scripts', 'apk-path.mjs'), join(dir, 'scripts', 'apk-path.mjs'));
  copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));
    copyFileSync(join(root, 'scripts', 'verify-apk.mjs'), join(dir, 'scripts', 'verify-apk.mjs'));
    mkdirSync(join(dir, 'dist'), { recursive: true });
    writeFileSync(join(dir, 'dist', 'index.html'),
      '<link rel="stylesheet" href="/assets/index-DZf2pR3U.css" />' +
      '<script type="module" src="/assets/index-xu-8vJth.js"></script>\n');
    const run = runIn(dir, 'scripts/verify-apk.mjs');
    eq('gate: no APK → exit 1', run.rc, 1);
    ok('gate: says there is no APK', /no APK/.test(run.stdout + run.stderr),
      (run.stdout + run.stderr).trim());
    rmSync(dir, { recursive: true, force: true });
  }

  // 6. Selector and gate must share ONE owner for artifact resolution.
  {
    const gate = readFileSync(join(root, 'scripts', 'verify-apk.mjs'), 'utf8');
    ok('gate: resolves the artifact through the shared lib',
      /from '\.\/apk-path-lib\.mjs'/.test(gate), 'no shared import found');
    const lib = readFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), 'utf8');
    ok('lib: prefers release over debug',
      lib.indexOf('app-release.apk') < lib.indexOf('app-debug.apk'),
      'release not declared first');
    ok('lib: exports the resolver the gate imports',
      /export function apkPath\(/.test(lib), 'apkPath() not exported');
  }

  // Cwd-independence: verify-apk must read THIS tree's dist/ and APK even
  // when invoked from elsewhere. It used to walk the caller's cwd, printing
  // "no APK in android/app/build/outputs/apk/..." on a green release.
  // The decoy holds no android/ artifacts; only the script path is ours.
  {
    const dir = mkdtempSync(join(tmpdir(), 'ember-var-'));
    const decoy = mkdtempSync(join(tmpdir(), 'ember-var-decoy-'));
    mkdirSync(join(dir, 'scripts'), { recursive: true });
    mkdirSync(join(dir, 'android', 'app', 'src', 'main', 'assets', 'public', 'assets'), { recursive: true });
    try {
      copyFileSync(join(root, 'scripts', 'verify-apk.mjs'), join(dir, 'scripts', 'verify-apk.mjs'));
      copyFileSync(join(root, 'scripts', 'apk-path-lib.mjs'), join(dir, 'scripts', 'apk-path-lib.mjs'));
      mkdirSync(join(dir, 'dist', 'assets'), { recursive: true });
      writeFileSync(join(dir, 'dist', 'index.html'),
        '<link rel="stylesheet" href="/assets/index-BwBI-kAv.css" />' +
        '<script type="module" src="/assets/index-BAhKqkTU.js"></script>\n');
      // Staging mirrors what `cap sync` copies; only the bundle assets matter.
      writeFileSync(join(dir, 'android', 'app', 'src', 'main', 'assets', 'public', 'assets', 'index-BAhKqkTU.js'), 'x');
      writeFileSync(join(dir, 'android', 'app', 'src', 'main', 'assets', 'public', 'assets', 'index-BwBI-kAv.css'), 'x');
      const st = runIn(decoy, join(dir, 'scripts', 'verify-apk.mjs'), ['--staging']);
      ok('--staging: rc 0 from an unrelated cwd with a valid dist tree', st.rc === 0,
        (st.stdout + st.stderr).slice(0, 160));
      ok('--staging: verdict names the fixture assets',
        /index-BAhKqkTU\.js: present/.test(st.stdout), st.stdout.slice(0, 160));
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(decoy, { recursive: true, force: true });
    }
  }

  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) {
    for (const f of fails) console.error('  ' + f);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});