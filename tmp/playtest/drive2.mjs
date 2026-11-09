/** Ember self-play drive 2: ride the default Mixup night, then switch to Chill via mode nav. */
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

await page.locator('input').nth(0).fill('Fred');
await page.locator('input').nth(1).fill('Christen');
await page.getByTestId('start').click();
await page.waitForTimeout(400);
await page.locator('button', { hasText: /ready/i }).click();
await page.waitForTimeout(800);
await shot('10-mixup-first-card');

// draw 8 with mixed rhythm (fast-fast-slow), capture every card's text
const cards = [];
for (let i = 0; i < 8; i++) {
  const txt = await page.locator('.cardzone').textContent().catch(() => '');
  cards.push((txt || '').replace(/\s+/g, ' ').slice(0, 160));
  await page.getByTestId('next').click();
  await page.waitForTimeout(i === 4 ? 1200 : 500);
}
await shot('11-after-8');

// soften a card (button is disabled when the card has no soften variant — skip then)
const softBtn = page.locator('button', { hasText: /Softening|Soften|Back up/i }).first();
if (await softBtn.count() && await softBtn.isEnabled()) { await softBtn.click(); await page.waitForTimeout(400); await shot('12-soften'); }

// skip twice
for (let i = 0; i < 2; i++) { await page.getByTestId('skip').click().catch(() => {}); await page.waitForTimeout(400); }
await shot('13-after-skips');

// release popover
await page.getByTestId('release').click().catch(() => {});
await page.waitForTimeout(300);
await shot('14-release-pop');
await page.getByTestId('release').click().catch(() => {});

// command token
await page.getByTestId('token').click().catch(() => {});
await page.waitForTimeout(500);
await shot('15-command-card');
await page.getByTestId('next').click().catch(() => {});
await page.waitForTimeout(400);

// end → landing → celebration
await page.locator('.icon-btn.end').click();
await page.waitForTimeout(700);
await shot('16-landing');
await page.getByTestId('finish').click();
await page.waitForTimeout(800);
await shot('17-celebration');
console.log('CARDS_SEEN:');
cards.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
