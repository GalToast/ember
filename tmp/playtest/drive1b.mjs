// repeat of drive1 but on the default Mixup flow (drive1's Chill click was already invalid)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const shot = (n) => page.screenshot({ path: `C:/Users/HP/repos/ember/tmp/playtest/shots/${n}.png` });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: /ready/i }).click();
  await page.waitForTimeout(700);
  const seen = [];
  for (let i = 0; i < 6; i++) {
    seen.push((await page.locator('.cardzone').textContent().catch(() => '') || '').replace(/\s+/g, ' ').slice(0, 80));
    await page.getByTestId('next').click();
    await page.waitForTimeout(450);
  }
  await page.locator('.icon-btn.end').click();
  await page.waitForTimeout(600);
  await shot('44-landing-v2');
  const landingTxt = (await page.locator('.cardzone').textContent().catch(() => '') || '').replace(/\s+/g, ' ');
  await page.getByTestId('finish').click();
  await page.waitForTimeout(500);
  console.log('SEEN:', JSON.stringify(seen));
  console.log('LANDING:', landingTxt.slice(0, 120));
  console.log('REPEAT_OF_SEEN:', seen.some((s) => landingTxt.includes(s.slice(0, 40)) && s.length > 10) ? 'YES — BUG' : 'no');
  console.log('PAGE_ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 200)); process.exit(1); });
