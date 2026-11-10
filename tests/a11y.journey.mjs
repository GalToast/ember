/**
 * Ember a11y journey — screen-reader-oriented night: every button named, live regions
 * announce draws, focus management across screens.
 * Run: node tests/a11y.journey.mjs   (needs preview on :4173)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
let fail = 0;
function check(name, cond, detail = '') {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ` — ${detail}` : ''));
  if (!cond) fail++;
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. every button on setup has an accessible name
  const setupUnnamed = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => !b.getAttribute('aria-label') && !(b.textContent || '').trim()).length);
  check('setup: zero unnamed buttons', setupUnnamed === 0);

  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(700);

  // 2. play screen: zero unnamed buttons
  const playUnnamed = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => !b.getAttribute('aria-label') && !(b.textContent || '').trim()).length);
  check('play: zero unnamed buttons', playUnnamed === 0, `${playUnnamed} unnamed`);

  // 3. card content is real text (screen readers can read it), not an image/canvas
  const cardText = await page.locator('.cardzone').textContent();
  check('card is readable text', (cardText || '').trim().length > 20);

  // 4. keyboard path: Tab reaches every dock button; Enter on Next advances
  await page.locator('body').press('Tab');
  let reached = 0;
  for (let i = 0; i < 12; i++) {
    const isNext = await page.evaluate(() => (document.activeElement?.getAttribute('data-testid') === 'next'));
    if (isNext) { await page.keyboard.press('Enter'); reached++; break; }
    await page.keyboard.press('Tab');
  }
  await page.waitForTimeout(600);
  check('keyboard reaches Next and Enter advances', reached === 1);

  // 5. export button appears on celebration and has a name
  // UX-2 arm-to-confirm: first tap arms, second tap (confirm) ends
  await page.locator('.icon-btn.end').click();
  await page.getByTestId('end-confirm-yes').click();
  await page.waitForTimeout(400);
  await page.getByTestId('finish').click();
  await page.waitForTimeout(600);
  const expBtn = page.getByTestId('export-history');
  check('export-history present on celebration', await expBtn.count() === 1);
  check('export button labeled', ((await expBtn.textContent()) || '').includes('Write our story down'));
  // download actually fires
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), expBtn.click()]);
  check('export produces a download', !!download, download ? (download.suggestedFilename() || '') : 'no event');
  if (download) check('export filename has ember prefix + date', /^ember-.*-\d{4}-\d{2}-\d{2}\.txt$/.test(download.suggestedFilename() || ''), download.suggestedFilename());

  check('zero page errors', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nA11Y JOURNEY FAIL (${fail})` : '\nA11Y JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
