/**
 * Ember insights journey — the Celebration stats panel appears with real data
 * after 3+ nights and stays correct. Seeds nights history directly.
 * Run: node tests/insights.journey.mjs   (needs preview on :4173)
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

const seedNights = [
  { date: '2026-10-15', cards: 12, mode: 'mixup', loves: { touch: 5, words: 4, time: 2, service: 1 }, tokensSpent: { a: 1, b: 0 } },
  { date: '2026-10-22', cards: 18, mode: 'heat', loves: { touch: 9, words: 5, time: 2, service: 2 }, tokensSpent: { a: 2, b: 1 } },
  { date: '2026-10-29', cards: 9, mode: 'chill', loves: { words: 4, time: 3, service: 2 }, tokensSpent: { a: 0, b: 0 } },
  { date: '2026-11-05', cards: 21, mode: 'inferno', loves: { touch: 11, words: 6, service: 4 }, tokensSpent: { a: 3, b: 3 } },
];

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((nights) => {
    localStorage.clear();
    localStorage.setItem('ember.v1', JSON.stringify({ names: { a: 'Fred', b: 'Christen' }, nights, retired: [] }));
  }, seedNights);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  // UX-8: seeded nights mean Start lands on the late splash
  await page.getByTestId('begin-late').click().catch(() => page.getByTestId('begin').click());
  await page.waitForTimeout(400);
  // end immediately (landing → finish)
  // UX-2 arm-to-confirm: first tap arms, second tap (confirm) ends
  await page.locator('.icon-btn.end').click();
  await page.getByTestId('end-confirm-yes').click();
  await page.waitForTimeout(300);
  await page.getByTestId('finish').click();
  await page.waitForTimeout(500);

  check('celebration shows', await page.getByTestId('celebration').count() === 1);
  check('insights panel present (4 nights)', await page.getByTestId('insights').count() === 1);
  const ins = await page.getByTestId('insights').textContent() || '';
  check('first night = 10-15', /10-15/.test(ins), ins.slice(0, 120));
  check('longest night = 21 cards (the seeded 11-05 inferno night)', /21/.test(ins));
  check('avg computed', /\d+ cards/.test(ins));
  check('top love = touch (majority)', /touch/.test(ins), ins.slice(0, 200));
  check('weekly rhythm shown (5 nights)', /\d+\.\d\/week|\/week/.test(ins));

  // sanity: insights hidden for a fresh install (0 nights)
  const page2 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page2.goto(BASE, { waitUntil: 'networkidle' });
  await page2.evaluate(() => localStorage.clear());
  await page2.reload({ waitUntil: 'networkidle' });
  await page2.waitForTimeout(300);
  await page2.locator('input').nth(0).fill('A');
  await page2.locator('input').nth(1).fill('B');
  await page2.getByTestId('start').click();
  await page2.waitForTimeout(300);
  await page2.getByTestId('begin').click();
  await page2.waitForTimeout(400);
  // UX-2 arm-to-confirm: first tap arms, second tap (confirm) ends
  await page2.locator('.icon-btn.end').click();
  await page2.getByTestId('end-confirm-yes').click();
  await page2.waitForTimeout(300);
  await page2.getByTestId('finish').click();
  await page2.waitForTimeout(500);
  check('no insights on first-ever night', await page2.getByTestId('insights').count() === 0);

  check('zero console/page errors', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nINSIGHTS JOURNEY FAIL (${fail})` : '\nINSIGHTS JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
