import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
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
  const unlabeled = await page.evaluate(() =>
    [...document.querySelectorAll('button')].filter((b) => !b.getAttribute('aria-label') && !(b.textContent || '').trim()).length
  );
  console.log('UNLABELED_BUTTONS_NOW:', unlabeled);
  const labels = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || (b.textContent || '').trim().slice(0, 10)).filter(Boolean));
  console.log('ALL_BUTTON_NAMES:', JSON.stringify(labels));
  await browser.close();
})().catch(e => { console.error('ERR:', e.message.slice(0, 150)); process.exit(1); });
