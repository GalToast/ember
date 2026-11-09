/** Ember self-play drive 3: Inferno night + Pass-the-Phone + Browse + Our Deck edge cases. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = 'C:/Users/HP/repos/ember/tmp/playtest/shots';
const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });

// --- INFERNO ---
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('input').nth(0).fill('Fred');
await page.locator('input').nth(1).fill('Christen');
await page.getByTestId('modes').getByRole('button', { name: /all spice bombs/i }).click();
await page.waitForTimeout(300);
await shot('19-inferno-warning');
await page.locator('button', { hasText: /Light it/i }).click();
await page.waitForTimeout(400);
await page.locator('button', { hasText: /ready/i }).click();
await page.waitForTimeout(800);
await shot('20-inferno-first');
const infernoCards = [];
for (let i = 0; i < 6; i++) {
  const txt = await page.locator('.cardzone').textContent().catch(() => '');
  infernoCards.push((txt || '').replace(/\s+/g, ' ').slice(0, 150));
  await page.getByTestId('next').click();
  await page.waitForTimeout(550);
}
await shot('21-inferno-mid');
// throat-round tap-rule: find the consent rail on a throat card
// end + finish
await page.locator('.icon-btn.end').click();
await page.waitForTimeout(500);
await page.getByTestId('finish').click();
await page.waitForTimeout(600);

// --- PASS THE PHONE ---
await page.locator('button', { hasText: /Keep going|Change the mode|home/i }).first().click().catch(() => {});
await page.waitForTimeout(500);
await shot('22-back-home');
await page.locator('button', { hasText: /Pass-the-phone/i }).click().catch(() => {});
await page.waitForTimeout(400);
await shot('23-ptp-setup');
await page.getByTestId('start').click().catch(() => {});
await page.waitForTimeout(500);
await page.locator('button', { hasText: /ready/i }).click().catch(() => {});
await page.waitForTimeout(700);
await shot('24-ptp-first');
await page.getByTestId('next').click().catch(() => {});
await page.waitForTimeout(600);
await shot('25-ptp-second');

console.log('INFERNO_CARDS:');
infernoCards.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
