// Single owner for "which APK does the release actually ship".
// Shared by scripts/apk-path.mjs (CLI), verify-apk.mjs (gate) and signing-verify.mjs.

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const RELEASE_APK = join('android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
export const DEBUG_APK = join('android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

/** The fresh release artifact, else the debug one. Never falses a path. */
export function apkPath() {
  return existsSync(RELEASE_APK) ? RELEASE_APK : DEBUG_APK;
}

/**
 * Same precedence as apkPath(), but rooted at [root].
 *
 * Why: a verifier invoked from outside the repo must not resolve against the
 * caller's cwd. Measured 2026-11-10 — signing-verify run from semantic-explorer
 * read that tree's (absent) APK and printed "not found" for a green build.
 */
export function apkPathIn(root) {
  return existsSync(join(root, RELEASE_APK))
    ? join(root, RELEASE_APK)
    : join(root, DEBUG_APK);
}

/** All existing APK variants, release first (stable for assertions). */
export function apkVariants() {
  return [RELEASE_APK, DEBUG_APK].filter((p) => existsSync(p));
}

/** Release wins even when debug is newer — the README install step depends on it. */
export function pickVariant() {
  const release = existsSync(RELEASE_APK);
  const debug = existsSync(DEBUG_APK);
  if (release) return { path: RELEASE_APK, variant: 'release', alternative: debug ? DEBUG_APK : null };
  return { path: DEBUG_APK, variant: 'debug', alternative: null };
}

/** Pick between release and debug without touching the filesystem twice. */
export function pickVariantStat() {
  const rel = existsSync(RELEASE_APK) ? statSync(RELEASE_APK) : null;
  const dbg = existsSync(DEBUG_APK) ? statSync(DEBUG_APK) : null;
  if (rel) return { path: RELEASE_APK, stat: rel, variant: 'release', alternative: dbg ? DEBUG_APK : null };
  return { path: DEBUG_APK, stat: dbg, variant: 'debug', alternative: null };
}