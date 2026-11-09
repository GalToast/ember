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
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('input').nth(0).fill('F');
  await page.locator('input').nth(1).fill('C');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const n = JSON.parse(localStorage.getItem('ember.night'));
    const all = [];
    for (const [d, size] of [['spark', 100], ['closer', 100], ['slowburn', 100], ['afterdark', 150], ['curious', 150]]) {
      for (let i = 1; i <= size; i++) all.push(`${d}-${String(i).padStart(3, '0')}`);
    }
    n.seen = all;
    localStorage.setItem('ember.night', JSON.stringify(n));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: /Resume/i }).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.getByTestId('next').click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'C:/Users/HP/repos/ember/tmp/playtest/shots/37-true-exhaust.png' });
  console.log('CELEBRATION_SHOWN:', await page.getByTestId('celebration').count());
  console.log('PAGE_ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
