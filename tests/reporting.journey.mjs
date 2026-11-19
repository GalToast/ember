/**
 * Ember reporting journey — the finale and the resume offer must describe the
 * night that actually happened.
 *
 * Written after the 2026-11-17 state-machine migration orphaned three counters:
 * `count` (only the deleted advance() wrote it), `persisted.nights` (the reducer
 * saved it, the component never read it back) and `persistNight()` (no longer
 * called on the draw path). Every visible surface was green while the peak-end
 * screen said "0 cards tonight · night #0 of yours" and a reload lost the night.
 *
 * Run: node tests/reporting.journey.mjs   (needs the preview server on :4173)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';

let fail = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ` — ${detail}` : ''));
  if (!cond) fail++;
}

async function beginNight(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const inputs = page.locator('input[placeholder="First name"]');
  await inputs.nth(0).fill('Fred');
  await inputs.nth(1).fill('Christen');
  await page.getByTestId('start').click();
  const begin = (await page.getByTestId('begin').count())
    ? page.getByTestId('begin')
    : page.getByTestId('begin-late');
  await begin.click();
  await page.waitForTimeout(600);
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // ---- 1. a night starts from the splash and deals its first card ----
  await beginNight(page);
  check('start -> stage mounts', (await page.getByTestId('stage').count()) === 1);
  check('no console/page errors', errors.length === 0, errors[0] || '');

  // ---- 2. the live night is persisted on the draw path ----
  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || 'null'));
  check('night persisted after the first card', !!stored, stored ? '' : 'ember.night is null');
  check('persisted count == 1 after the first card', stored?.count === 1, `count=${stored?.count}`);

  // ---- 3. deal two more cards: 3 dealt, the finale must say 3 ----
  for (let i = 0; i < 2; i++) {
    await page.getByTestId('next').click();
    await page.waitForTimeout(300);
  }
  const dealt = 3;

  // ---- 4. reload mid-night: the night must survive (CRITIQUES #1) ----
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const resumeOffered = await page.getByText(/Resume your night/i).count();
  check('reload mid-night offers "Resume your night"', resumeOffered > 0, `${resumeOffered} matches`);

  // ---- 5. end the night: warm landing, then the finale ----
  // Resume so we are on the play screen with the same persisted night.
  if (resumeOffered) {
    await page.getByText(/Resume your night/i).first().click();
    await page.waitForTimeout(600);
  }
  const endBtn = page.locator('button[aria-label="End the night"]');
  if (await endBtn.count()) {
    await endBtn.click();
    await page.waitForTimeout(300);
    const yes = page.getByTestId('end-confirm-yes');
    if (await yes.count()) await yes.click();
    await page.waitForTimeout(700);
  }
  const finish = page.getByTestId('finish');
  if (await finish.count()) {
    check('warm landing card is dealt before the finale', true);
    await finish.click();
    await page.waitForTimeout(900);
  }
  check('finale renders', (await page.getByTestId('celebration').count()) === 1);

  const finale = (await page.getByTestId('celebration').innerText()).replace(/\s+/g, ' ');
  check(
    `finale reports the ${dealt} cards actually dealt`,
    new RegExp(`\\b${dealt} cards tonight`).test(finale),
    finale.slice(0, 120),
  );
  check(
    'finale reports night #1, not night #0',
    /night #1 of yours/.test(finale),
    (finale.match(/night #\d+ of yours/) || ['(none)'])[0],
  );

  const savedNights = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('ember.v1') || 'null');
    return p?.nights?.length ?? 0;
  });
  check('the finished night was saved to history', savedNights === 1, `${savedNights} saved`);

  check('still no console/page errors', errors.length === 0, errors[0] || '');

  await browser.close();
  console.log(fail ? `\n${fail} CHECK(S) FAILED` : '\nALL REPORTING CHECKS PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
