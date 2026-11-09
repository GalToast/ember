import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  for (const ms of [300, 800, 1500, 2500]) {
    await page.waitForTimeout(ms === 300 ? 300 : (ms === 800 ? 500 : ms === 1500 ? 700 : 1000));
    const info = await page.evaluate(() => {
      const els = [...document.querySelectorAll('body > *, #app > *')];
      return els.map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return `${el.tagName}.${(el.className || '').toString().slice(0, 30)} op=${cs.opacity} disp=${cs.display} z=${cs.zIndex} pos=${cs.position} rect=${Math.round(r.width)}x${Math.round(r.height)}@y${Math.round(r.y)}`;
      });
    });
    console.log(`--- +${ms}ms ---`); info.forEach((l) => console.log(' ', l));
  }
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 150)); process.exit(1); });
