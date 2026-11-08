/**
 * Ember release-token journey — one release per night: held → gifted → spent,
 * UI states, persistence, celebration line.
 * Run: node tests/release.journey.mjs   (needs preview on :4173)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
let fail = 0;
function check(name, cond, detail = '') {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ` — ${detail}` : ''));
  if (!cond) fail++;
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.getByTestId('begin').click();
  await page.waitForTimeout(500);

  // 1. release star visible while held
  check('release star shows while held', await page.getByTestId('release').count() === 1);

  // 2. Fred holds it → the gift/keep buttons show on his turn
  const night0 = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));
  check('release initialized (holder b, held)', night0.release?.holder === 'b' && night0.release?.state === 'held', JSON.stringify(night0.release));
  await page.getByTestId('release').click();
  await page.waitForTimeout(300);
  check('popover opens with gift + keep', await page.getByTestId('release-pop').count() === 1 && await page.getByTestId('release-gift').count() === 1);

  // 3. gift it → holder flips to b, buttons hide (not Fred's turn-holder anymore)
  await page.getByTestId('release-gift').click();
  await page.waitForTimeout(200);
  await page.getByTestId('release').click(); // toggle popover closed (state reset)
  await page.waitForTimeout(300);
  const night1 = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));
  check('gift flips holder to a', night1.release?.holder === 'a' && night1.release?.state === 'held', JSON.stringify(night1.release));
  await page.getByTestId('release').click(); await page.waitForTimeout(200);
  check('popover shows non-holder note', await page.getByTestId('release-pop').count() === 1 && /holds/.test(await page.getByTestId('release-pop').textContent() || ''), (await page.getByTestId('release-pop').textContent() || ''));
  await page.getByTestId('release').click(); await page.waitForTimeout(200);

  // 4. persistence: reload + resume keeps the gifted state
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: /Resume/i }).click();
  await page.waitForTimeout(500);
  const night2 = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));
  check('gifted state survives resume', night2.release?.holder === 'a', JSON.stringify(night2.release));

  // 5. gift back (Christen's turn comes around) and spend — celebration line
  // advance until b holds the release AND it's b's turn (gifting auto-flips holder; draws flip turn)
  let spent = false;
  for (let i = 0; i < 8 && !spent; i++) {
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));
    if (n.release?.holder === 'a' && n.turn === 'a' && n.release?.state === 'held') {
      if (await page.getByTestId('release').count()) { await page.getByTestId('release').click(); await page.waitForTimeout(200); }
      if (await page.getByTestId('release-spend').count()) {
        await page.getByTestId('release-spend').click();
        await page.waitForTimeout(300);
        spent = true;
      }
    } else {
      await page.getByTestId('next').click().catch(() => {});
      await page.waitForTimeout(150);
    }
  }
  check('release spendable on holder turn', spent);
  const night3 = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));
  check('spent state persisted', night3.release?.state === 'spent', JSON.stringify(night3.release));
  check('release star hidden after spend', await page.getByTestId('release').count() === 0);

  // 6. end the night → celebration names it
  await page.locator('.icon-btn.end').click();
  await page.waitForTimeout(300);
  await page.getByTestId('finish').click();
  await page.waitForTimeout(500);
  check('celebration reached', await page.getByTestId('celebration').count() === 1);
  const relLine = await page.getByTestId('release-line').textContent() || '';
  check('celebration names the release', /kept the release/.test(relLine), relLine);

  check('zero console/page errors', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nRELEASE JOURNEY FAIL (${fail})` : '\nRELEASE JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
