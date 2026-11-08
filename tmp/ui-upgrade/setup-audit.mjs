// Setup/Celebration fit audit — does the first screen fit without scrolling?
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');
const BASE = process.env.BASE || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  for (const [label, vp] of [['360x780', { width: 360, height: 780 }], ['393x851', { width: 393, height: 851 }]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const r0 = await page.evaluate(() => {
      const wrap = document.querySelector('.wrap');
      const start = [...document.querySelectorAll('button')].find(b => /start the night/i.test(b.textContent || ''));
      const sr = start?.getBoundingClientRect();
      return {
        wrapScrolls: wrap ? wrap.scrollHeight - wrap.clientHeight : null,
        contentH: wrap?.scrollHeight, viewH: wrap?.clientHeight,
        startVisible: sr ? sr.bottom <= window.innerHeight && sr.top >= 0 : null,
        startBottom: sr ? Math.round(sr.bottom) : null,
        vh: window.innerHeight,
      };
    });
    console.log(`${label} setup (no mode picked):`, JSON.stringify(r0));
    // pick Inferno (worst case: warning panel adds height)
    await page.locator('button.mode', { hasText: 'Inferno' }).first().click();
    await page.waitForTimeout(300);
    const r1 = await page.evaluate(() => {
      const wrap = document.querySelector('.wrap');
      const start = [...document.querySelectorAll('button')].find(b => /start the night/i.test(b.textContent || ''));
      const sr = start?.getBoundingClientRect();
      return {
        wrapScrolls: wrap ? wrap.scrollHeight - wrap.clientHeight : null,
        startVisible: sr ? sr.bottom <= window.innerHeight : null,
        startBottom: sr ? Math.round(sr.bottom) : null,
        vh: window.innerHeight,
      };
    });
    console.log(`${label} setup (inferno picked):  `, JSON.stringify(r1));
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error('audit error:', e.message); process.exit(2); });
