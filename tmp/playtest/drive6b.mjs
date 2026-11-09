/** drive6 retry: tablet + desktop card/celebration (the part that timed out last run) */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  for (const vp of [{ name: 'tablet', w: 1280, h: 800 }, { name: 'desktop', w: 1920, h: 1080 }]) {
    const page = await (await browser.newContext({ viewport: { width: vp.w, height: vp.h } })).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.locator('input').nth(0).fill('Fred');
    await page.locator('input').nth(1).fill('Christen');
    await page.getByTestId('start').click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: /ready/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `C:/Users/HP/repos/ember/tmp/playtest/shots/75-${vp.name}-card.png` });
    await page.getByTestId('next').click(); await page.waitForTimeout(500);
    await page.locator('.icon-btn.end').click(); await page.waitForTimeout(600);
    await page.getByTestId('finish').click(); await page.waitForTimeout(700);
    await page.screenshot({ path: `C:/Users/HP/repos/ember/tmp/playtest/shots/76-${vp.name}-celebration.png` });
    console.log(`${vp.name}: errors=${errors.length}`);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 200)); process.exit(1); });
