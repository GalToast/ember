// Ember UI upgrade smoke test — screenshots across phone + tv viewports.
// Run: node tmp/ui-upgrade/smoke.mjs  (preview server must be on :4174)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/HP/repos/semantic-explorer/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4174';
const OUT = 'C:/Users/HP/repos/ember/tmp/ui-upgrade';
const fs = await import('node:fs');
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const consoleMsgs = [];

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  // ---- phone viewport 390x844 ----
  const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const phone = await phoneCtx.newPage();
  phone.on('pageerror', (e) => errors.push('phone pageerror: ' + e.message));
  phone.on('console', (m) => { if (m.type() === 'error') errors.push('phone console: ' + m.text()); });

  await phone.goto(BASE, { waitUntil: 'networkidle' });
  await phone.waitForTimeout(300);
  await phone.screenshot({ path: `${OUT}/phone-setup.png`, fullPage: true });

  const inputs = phone.locator('input');
  await inputs.nth(0).fill('Fred');
  await inputs.nth(1).fill('Christen');
  await phone.screenshot({ path: `${OUT}/phone-setup-names.png`, fullPage: true });

  await phone.getByRole('button', { name: /start/i }).first().click();
  await phone.waitForTimeout(300);
  await phone.screenshot({ path: `${OUT}/phone-splash.png`, fullPage: true });

  await phone.getByRole('button', { name: /we.?re ready|begin/i }).first().click();
  await phone.waitForTimeout(400);

  for (let i = 1; i <= 3; i++) {
    await phone.waitForSelector('[data-testid="card"]', { state: 'visible', timeout: 10000 });
    await phone.waitForTimeout(450); // let deal-in animation settle
    await phone.screenshot({ path: `${OUT}/phone-card${i}.png`, fullPage: true });
    const hasTimer = await phone.locator('[data-testid="card"] .timer').count() > 0;
    console.log(`card${i}: timer=${hasTimer}`);
    if (i < 3) {
      await phone.getByRole('button', { name: /next/i }).first().click();
      await phone.waitForTimeout(300);
    }
  }

  // ---- tv viewport 1280x720 ----
  const tvCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const tv = await tvCtx.newPage();
  tv.on('pageerror', (e) => errors.push('tv pageerror: ' + e.message));
  tv.on('console', (m) => { if (m.type() === 'error') errors.push('tv console: ' + m.text()); });

  await tv.goto(BASE, { waitUntil: 'networkidle' });
  await tv.waitForTimeout(300);
  await tv.screenshot({ path: `${OUT}/tv-setup.png`, fullPage: true });

  const tvinputs = tv.locator('input');
  await tvinputs.nth(0).fill('Fred');
  await tvinputs.nth(1).fill('Christen');
  await tv.getByRole('button', { name: /start/i }).first().click();
  await tv.waitForTimeout(300);
  await tv.screenshot({ path: `${OUT}/tv-splash.png`, fullPage: true });
  await tv.getByRole('button', { name: /we.?re ready|begin/i }).first().click();
  await tv.waitForTimeout(400);
  await tv.waitForSelector('[data-testid="card"]', { state: 'visible', timeout: 10000 });
  await tv.waitForTimeout(450);
  await tv.screenshot({ path: `${OUT}/tv-card1.png`, fullPage: true });

  await browser.close();

  console.log('\n--- CONSOLE ERRORS ---');
  console.log(errors.length ? errors.join('\n') : '(none)');
  fs.writeFileSync(`${OUT}/console-errors.txt`, errors.join('\n') + '\n');
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.error('smoke harness error:', e.message); process.exit(2); });
