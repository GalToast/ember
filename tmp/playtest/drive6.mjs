/** Ember self-play drive 6: viewport matrix — landscape phone, tablet, desktop, TV. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = 'C:/Users/HP/repos/ember/tmp/playtest/shots';
const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

const VIEWPORTS = [
  { name: 'landscape-phone', w: 844, h: 390 },
  { name: 'tablet', w: 1280, h: 800 },
  { name: 'desktop', w: 1920, h: 1080 },
];

const results = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/60-${vp.name}-setup.png` });
  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/61-${vp.name}-card.png` });
  // check dock + card both fully visible: dock buttons' bounding boxes within viewport
  const dock = await page.getByTestId('next').boundingBox();
  const card = await page.locator('.cardzone').boundingBox();
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const overflowY = await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight);
  results.push({
    vp: vp.name,
    dockVisible: !!dock && dock.y + dock.height <= vp.h && dock.y >= 0,
    cardVisible: !!card && card.y + card.height <= vp.h,
    overflowX, overflowY,
    errors: errors.length,
  });
  // play 2 cards + end night at this width
  await page.getByTestId('next').click(); await page.waitForTimeout(400);
  await page.locator('.icon-btn.end').click(); await page.waitForTimeout(500);
  await page.getByTestId('finish').click(); await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/62-${vp.name}-celebration.png` });
  const cel = await page.locator('.cardzone, main').first().boundingBox();
  results[results.length - 1].celebrationOk = !!cel && cel.y >= 0;
  await ctx.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
