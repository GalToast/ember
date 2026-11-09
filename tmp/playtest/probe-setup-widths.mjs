import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const vp of [{ w: 844, h: 390, n: 'ls-phone' }, { w: 1280, h: 800, n: 'tablet' }, { w: 1920, h: 1080, n: 'desktop' }]) {
    const page = await (await browser.newContext({ viewport: { width: vp.w, height: vp.h } })).newPage();
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const inputs = await page.locator('input').count();
    const setupBox = await page.locator('main, .setup, section').first().boundingBox().catch(() => null);
    const overflowY = await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight);
    await page.screenshot({ path: `C:/Users/HP/repos/ember/tmp/playtest/shots/70-${vp.n}.png` });
    console.log(`${vp.n}: inputs=${inputs} setupY=${setupBox ? Math.round(setupBox.y) : 'none'} setupH=${setupBox ? Math.round(setupBox.height) : 0} overflowY=${overflowY}`);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 200)); process.exit(1); });
