/** Ember self-play drive 4: long-press PTP reveal + deck exhaustion + kill/resume + back-swipe skip. */
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

// PTP long-press reveal (3 presses to keep it open)
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('input').nth(0).fill('Fred');
await page.locator('input').nth(1).fill('Christen');
await page.getByTestId('ptp-open').click();
await page.waitForTimeout(400);
await page.getByTestId('start').click().catch(() => {});
await page.waitForTimeout(500);
await page.locator('button', { hasText: /ready/i }).click().catch(() => {});
await page.waitForTimeout(700);
// 3 long presses
for (let i = 0; i < 3; i++) {
  const card = page.locator('.pcard, [data-testid=pcard]').first();
  const box = await (card.count() ? card : page.locator('main').first()).boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
  await page.waitForTimeout(350);
}
await shot('30-ptp-revealed');
const ptpTxt = await page.locator('.cardzone, main').first().textContent().catch(() => '');
console.log('PTP_REVEAL:', (ptpTxt || '').replace(/\s+/g, ' ').slice(0, 220));

// kill mid-night: reload → resume
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await shot('31-after-kill');
const resumeBtn = page.locator('button', { hasText: /Resume/i });
console.log('RESUME_OFFERED:', await resumeBtn.count());
if (await resumeBtn.count()) { await resumeBtn.click(); await page.waitForTimeout(600); await shot('32-resumed'); }

// back-swipe = skip (touch-like drag on the card)
await page.mouse.move(300, 400);
await page.mouse.down();
await page.mouse.move(80, 400, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(500);
await shot('33-after-backswipe');
const n1 = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));

// deck exhaustion probe: chill-only tiny deck — set seen to nearly all, verify no crash on near-empty draw
await page.evaluate(() => {
  const n = JSON.parse(localStorage.getItem('ember.night'));
  n.mode = 'chill'; n.decks = ['closer'];
  n.seen = Array.from({ length: 99 }, (_, i) => `closer-${String(i).padStart(3, '0')}`);
  localStorage.setItem('ember.night', JSON.stringify(n));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.locator('button', { hasText: /Resume/i }).click().catch(() => {});
await page.waitForTimeout(600);
await page.getByTestId('next').click().catch(() => {});
await page.waitForTimeout(600);
await shot('34-exhausted');
const exhausted = await page.locator('.cardzone').textContent().catch(() => 'NO CARD');
console.log('EXHAUSTION_CARD:', (exhausted || '').replace(/\s+/g, ' ').slice(0, 140));
console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
