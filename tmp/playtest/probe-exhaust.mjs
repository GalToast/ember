// What happens when EVERYTHING is retired? draw returns null → App shows?
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  // retire the entire spark deck (100 cards) + set a tiny chill night
  const ids = [];
  for (let i = 0; i < 100; i++) ids.push(`spark-${String(i).padStart(3, '0')}`);
  await page.evaluate((retired) => {
    localStorage.setItem('ember.v1', JSON.stringify({ names: { a: 'F', b: 'C' }, nights: [], retired }));
  }, ids);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // start a CHILL night (spark+closer): spark retired → closer only (100 cards) — draw works.
  // Now retire closer too by playing 100 draws? Too slow. Instead: check next() when draw returns null.
  // Simulate via direct engine state: seed seen with ALL closer ids through the night
  await page.locator('input').nth(0).fill('F');
  await page.locator('input').nth(1).fill('C');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(600);
  // mark all closer cards seen via the night's seen set
  await page.evaluate(() => {
    const n = JSON.parse(localStorage.getItem('ember.night'));
    n.seen = Array.from({ length: 100 }, (_, i) => `closer-${String(i).padStart(3, '0')}`).concat(n.seen || []);
    localStorage.setItem('ember.night', JSON.stringify(n));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: /Resume/i }).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.getByTestId('next').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'C:/Users/HP/repos/ember/tmp/playtest/shots/35-all-seen.png' });
  const txt = await page.locator('.cardzone').textContent().catch(() => 'NO CARDZONE');
  console.log('ALL_SEEN_CARD:', (txt || 'EMPTY').replace(/\s+/g, ' ').slice(0, 120));
  console.log('PAGE_ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
