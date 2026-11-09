/** Ember self-play driver: plays a night like a couple would, screenshotting key beats. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
const mkdir = (await import('node:fs')).mkdirSync;
mkdir('C:/Users/HP/repos/ember/tmp/playtest/shots', { recursive: true });

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = 'C:/Users/HP/repos/ember/tmp/playtest/shots';

const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const night = () => page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await shot('00-splash');

// name entry
await page.locator('input').nth(0).fill('Fred');
await page.locator('input').nth(1).fill('Christen');
await shot('01-names');
await page.getByTestId('start').click();
await page.waitForTimeout(400);
await shot('02-closemodal');
await page.locator('button', { hasText: /ready/i }).click();
await page.waitForTimeout(400);
await shot('02-modepick');

// CHILL first
await page.locator('button', { hasText: /Chill/i }).click();
await page.waitForTimeout(300);
await page.getByTestId('begin').click();
await page.waitForTimeout(700);
await shot('10-first-card');

// read 5 cards, alternating swipe paths, capture text along the way
const cards = [];
for (let i = 0; i < 5; i++) {
  const txt = await page.locator('.card, [data-testid=stage] main, .cardzone').first().textContent().catch(() => '');
  cards.push(txt?.slice(0, 200));
  await page.getByTestId('next').click();
  await page.waitForTimeout(650);
  if (i === 2) await shot('11-midnight');
}
await shot('12-after-five');

// soften + skip UX
const softVisible = await page.locator('button', { hasText: /Soften/i }).count();
await page.locator('button', { hasText: /Skip/i }).click().catch(() => {});
await page.waitForTimeout(400);

// release popover
await page.getByTestId('release').click().catch(() => {});
await page.waitForTimeout(300);
await shot('13-release-pop');
await page.keyboard.press('Escape').catch(() => {});
await page.getByTestId('release').click().catch(() => {}); // close

// end night → landing → celebration
await page.locator('.icon-btn.end').click();
await page.waitForTimeout(600);
await shot('14-landing');
await page.getByTestId('finish').click();
await page.waitForTimeout(700);
await shot('15-celebration');

console.log(JSON.stringify({ cards, softVisible, errors, nightState: await night().then?.() ?? await night() }, null, 1).slice(0, 3000));
await browser.close();
