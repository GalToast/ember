/**
 * Ember seeds journey — two-sided authorship must actually pay off.
 *
 * Proves the four things the mechanic is worthless without:
 *   1. PRIVACY  — a planted wish is absent from the DOM until its card is dealt,
 *                 and the other partner's wish never leaks early.
 *   2. ARRIVAL  — each wish arrives as a card at its engineered moment.
 *   3. ANONYMITY — the dealt card does not name its author (that is the reveal).
 *   4. ATTRIBUTION — the finale names who planted what.
 * Plus: a resumed night restores the seed card instead of stepping over it.
 *
 * Run: node tests/seeds.journey.mjs   (needs the preview server on :4173)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// PW_ROOT: the shared box installs Playwright under semantic-explorer; override with
// PW_ROOT when running elsewhere. See AGENTS/README for the shared-tooling convention.
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const WISH_A = 'slow mornings where nobody reaches for a phone';
const WISH_B = 'twenty minutes of dancing in the kitchen';
const BOUNDARY_A = 'nothing about work tonight';

let fail = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ` — ${detail}` : ''));
  if (!cond) fail++;
}
const body = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const names = page.locator('input[placeholder="First name"]');
  await names.nth(0).fill('Fred');
  await names.nth(1).fill('Christen');

  // ---- plant: A ----
  await page.getByTestId('seeds-open').click();
  await page.getByTestId('seed-setup').waitFor({ state: 'visible', timeout: 5000 });
  check('seed entry opens', true);
  await page.getByTestId('seed-wish').fill(WISH_A);
  await page.getByTestId('seed-boundary').fill(BOUNDARY_A);
  await page.getByTestId('seed-seal').click();
  await page.waitForTimeout(300);

  // ---- handoff: A's words must not be on screen while B takes the phone ----
  const handoffText = await body(page);
  check('handoff screen appears', /Pass the phone/i.test(handoffText));
  check("A's wish is not shown on the handoff screen", !handoffText.includes(WISH_A), handoffText.slice(0, 80));
  await page.getByTestId('seed-handoff').click();
  await page.waitForTimeout(300);

  // ---- plant: B; A's wish must not be visible while B types ----
  const bScreen = await body(page);
  check("A's wish is not shown while B is writing", !bScreen.includes(WISH_A));
  check("A's boundary is not shown while B is writing", !bScreen.includes(BOUNDARY_A));
  await page.getByTestId('seed-wish').fill(WISH_B);
  await page.getByTestId('seed-seal').click();
  await page.waitForTimeout(400);

  // ---- back on setup: both sealed, neither revealed ----
  const setupText = await body(page);
  check('setup shows both seeds sealed', /Planted — 2 sealed/i.test(setupText), setupText.slice(0, 120));
  check('setup does not reveal either wish', !setupText.includes(WISH_A) && !setupText.includes(WISH_B));

  // ---- play: the wishes must stay hidden until their cards ----
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  const begin = (await page.getByTestId('begin').count()) ? page.getByTestId('begin') : page.getByTestId('begin-late');
  await begin.click();
  await page.waitForTimeout(600);

  check('card 1 does not leak a seed', !(await body(page)).includes(WISH_A));
  await page.getByTestId('next').click(); await page.waitForTimeout(250);
  check('card 2 does not leak a seed', !(await body(page)).includes(WISH_A));
  await page.getByTestId('next').click(); await page.waitForTimeout(350);

  // ---- card 3: A's seed arrives, anonymously ----
  const card3 = await body(page);
  check("A's wish arrives as card 3", card3.includes(WISH_A), card3.slice(0, 90));
  check('the dealt seed does not name its author', !/Fred|Christen/.test(card3), card3.slice(0, 90));
  check("B's wish has not leaked by card 3", !card3.includes(WISH_B));

  // ---- resume: the seed card must survive a reload, not be skipped ----
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const resume = page.getByText(/Resume your night/i).first();
  check('resume offered after the seed card', (await resume.count()) > 0);
  if (await resume.count()) { await resume.click(); await page.waitForTimeout(600); }
  const afterReload = await body(page);
  check('resumed night restores the seed card', afterReload.includes(WISH_A));
  check("B's wish still hidden after resume", !afterReload.includes(WISH_B));

  // ---- card 7: B's seed arrives ----
  for (let i = 0; i < 4; i++) { await page.getByTestId('next').click(); await page.waitForTimeout(250); }
  const card7 = await body(page);
  check("B's wish arrives as card 7", card7.includes(WISH_B), card7.slice(0, 90));

  // ---- finale: attribution ----
  const endBtn = page.locator('button[aria-label="End the night"]');
  if (await endBtn.count()) {
    await endBtn.click(); await page.waitForTimeout(250);
    const yes = page.getByTestId('end-confirm-yes');
    if (await yes.count()) await yes.click();
    await page.waitForTimeout(600);
  }
  if (await page.getByTestId('finish').count()) { await page.getByTestId('finish').click(); await page.waitForTimeout(800); }
  check('finale renders', (await page.getByTestId('celebration').count()) === 1);

  const reveal = page.getByTestId('seed-reveal');
  check('finale has a seed reveal', (await reveal.count()) === 1);
  if (await reveal.count()) {
    const revealText = (await reveal.innerText()).replace(/\s+/g, ' ');
    const rows = await page.getByTestId('seed-reveal-row').count();
    check('both seeds are attributed', rows === 2, `${rows} rows`);
    check('reveal names Fred with Fred\'s wish', /Fred/.test(revealText) && revealText.includes(WISH_A), revealText.slice(0, 120));
    check('reveal names Christen with Christen\'s wish', /Christen/.test(revealText) && revealText.includes(WISH_B));
    check('the boundary was honoured and not quoted', revealText.includes('off the table') && !revealText.includes(BOUNDARY_A));
  }

  check('no console/page errors', errors.length === 0, errors[0] || '');

  await browser.close();
  console.log(fail ? `\nSEEDS JOURNEY FAIL (${fail})` : '\nSEEDS JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
