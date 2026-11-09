import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  for (const ms of [500, 1000, 2000]) {
    await page.waitForTimeout(ms === 500 ? 500 : ms - (ms === 1000 ? 500 : 1000));
    const vis = await page.locator('input').first().isVisible().catch(() => false);
    console.log(`at +${ms}ms: setup inputs visible = ${vis}`);
    if (vis) { await page.screenshot({ path: 'C:/Users/HP/repos/ember/tmp/playtest/shots/71-ls-setup-confirm.png' }); break; }
  }
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 150)); process.exit(1); });
