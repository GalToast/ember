import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/HP/repos/ember/tmp/playtest/shots/72-a.png' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'C:/Users/HP/repos/ember/tmp/playtest/shots/72-b.png' });
  // pixel variance via canvas in-page: draw nothing, just measure text nodes' client rects
  const textPixels = await page.evaluate(() => {
    const els = [...document.querySelectorAll('input, button, h1, h2')];
    return els.filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length;
  });
  console.log('VISIBLE_INTERACTIVE:', textPixels);
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 150)); process.exit(1); });
