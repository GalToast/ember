/** a11y probe: reduced motion, aria on dock, focus order, contrast-critical inline styles */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  // context WITH reduced motion
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.locator('input').nth(0).fill('F');
  await page.locator('input').nth(1).fill('C');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(700);
  // 1. reduced-motion: no 'enter'/'deal' animation classes should animate long — check
  //    the CSS var / media query is honored (cards should appear instantly)
  const animState = await page.evaluate(() => {
    const el = document.querySelector('.cardzone article, .cardzone > div');
    return el ? getComputedStyle(el).animationDuration : 'none';
  });
  console.log('REDUCED_MOTION animDuration on card:', animState);
  // 2. aria: dock buttons labeled?
  const aria = await page.evaluate(() => [...document.querySelectorAll('nav button')].map((b) => (b.getAttribute('aria-label') || b.textContent?.trim()?.slice(0, 12) || 'UNLABELED')));
  console.log('DOCK_ARIA:', JSON.stringify(aria));
  // 3. keyboard playability: tab reaches Next; Enter activates
  await page.keyboard.press('Tab');
  const focused1 = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 14) || document.activeElement?.tagName);
  // tab through all dock buttons
  const order = [];
  for (let i = 0; i < 6; i++) { order.push(await page.evaluate(() => (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim()?.slice(0, 12) || document.activeElement?.tagName))); await page.keyboard.press('Tab'); }
  console.log('TAB_ORDER:', JSON.stringify(order));
  // 4. swipe-hint for keyboard: is there any keyboard path to next/skip visible in copy?
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 200)); process.exit(1); });
