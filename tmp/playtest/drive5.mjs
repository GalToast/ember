/** Ember self-play drive 5: Our Deck builder edge cases + Browse flip + timer/ambient sound audit. */
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

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// BROWSE: open, flip some cards, exit
await page.getByTestId('browse-open').click();
await page.waitForTimeout(600);
await shot('40-browse');
for (let i = 0; i < 3; i++) { await page.getByTestId('next').click().catch(() => {}); await page.waitForTimeout(400); }
await page.locator('button', { hasText: /Back|Close|Done/i }).first().click().catch(() => {});
await page.waitForTimeout(400);

// OUR DECK: write a card with house-rule validation
await page.getByTestId('custom-open').click();
await page.waitForTimeout(600);
await shot('41-custom-empty');
const inputs = page.locator('input, textarea');
console.log('CUSTOM_INPUTS:', await inputs.count());
// type an invalid card (if validation is live, an error should appear)
const ta = page.locator('textarea').first();
if (await ta.count()) {
  await ta.fill('Whisper a secret into their neck and bite down until they gasp and bleed for you.');
  await page.waitForTimeout(500);
  await shot('42-custom-validation');
  const warn = await page.locator('.warn, [class*=error], [class*=invalid]').allTextContents().catch(() => []);
  console.log('VALIDATION:', JSON.stringify(warn).slice(0, 200));
}
// export/import buttons present?
console.log('EXPORT_BTN:', await page.locator('button', { hasText: /Export/i }).count(), '| IMPORT_BTN:', await page.locator('button', { hasText: /Import/i }).count());

// mute toggle + timer presence on a challenge card
await page.locator('button', { hasText: /Close|Back/i }).first().click().catch(() => {});
await page.waitForTimeout(300);
await page.locator('input').nth(0).fill('F');
await page.locator('input').nth(1).fill('C');
await page.getByTestId('start').click();
await page.waitForTimeout(300);
await page.locator('button', { hasText: /ready/i }).click();
await page.waitForTimeout(600);
// find a timed card (challenge) and check the timer element exists
for (let i = 0; i < 6; i++) {
  const timer = await page.locator('.timer, [class*=timer], svg circle').count();
  if (timer) { await shot('43-timer-card'); break; }
  await page.getByTestId('next').click(); await page.waitForTimeout(500);
}
console.log('TIMER_FOUND:', await page.locator('.timer, [class*=timer]').count());
await page.getByTestId('mute').click();
await page.waitForTimeout(200);
console.log('MUTED_AFTER_TAP:', await page.evaluate(() => localStorage.getItem('ember.muted')));
console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
