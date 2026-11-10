/**
 * Ember token-economy journey — command tokens: spend, banner, no-skip, finale.
 * Run: node tests/tokens.journey.mjs   (needs preview on :4173)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
let fail = 0;
function check(name, cond, detail = '') {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ` — ${detail}` : ''));
  if (!cond) fail++;
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  await page.getByText(/We'?re ready/i).click();
  await page.waitForTimeout(400);

  // 1. token display exists: both players at 3
  const tokens = await page.getByTestId('tokens').textContent();
  check('token display renders', /3/.test(tokens || ''), tokens || '');
  const cur = await page.locator('.tk.cur').textContent();
  check('current turn highlighted', !!cur, cur || '');

  // 2. spend a token: command banner appears, skip/soften gone
  await page.getByTestId('token').click();
  await page.waitForTimeout(400);
  check('command banner shows', await page.getByTestId('command-banner').count() === 1);
  check('banner says no skip no soften', /no skip/i.test(await page.getByTestId('command-banner').textContent() || ''));
  check('skip hidden during command', await page.getByTestId('skip').count() === 0);
  check('next becomes Done', /Done/.test(await page.getByTestId('next').textContent() || ''));

  // 3. token decremented
  const afterSpend = await page.getByTestId('tokens').textContent();
  check('token count decremented', /2/.test(afterSpend || ''), afterSpend || '');

  // 4. done -> normal dock returns, skip/soften/never-again back
  await page.getByTestId('next').click();
  await page.waitForTimeout(400);
  check('dock restored after command', await page.getByTestId('skip').count() === 1 && await page.locator('.btn-ghost', { hasText: 'Soften' }).count() === 1);

  // 5. token state survives reload (mid-night persistence)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));
  check('token state persisted', stored.tokens && typeof stored.tokens.a === 'number' && typeof stored.turn === 'string', JSON.stringify(stored.tokens) + ' turn=' + stored.turn);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: /Resume/i }).click();
  await page.waitForTimeout(500);
  const afterReload = await page.getByTestId('tokens').textContent();
  check('tokens survive resume', /2/.test(afterReload || ''), afterReload || '');

  // 6. end the night with an unspent token -> finale banner (two-step: landing, then finish)
  // UX-2 arm-to-confirm: first tap arms, second tap (confirm) ends
  await page.locator('.icon-btn.end').click();
  await page.getByTestId('end-confirm-yes').click();
  await page.waitForTimeout(400);
  await page.getByTestId('finish').click();
  await page.waitForTimeout(500);
  const finale = await page.getByTestId('token-finale').count();
  check('unspent-token finale shows', finale === 1);
  const finaleText = await page.getByTestId('token-finale').textContent() || '';
  check('finale names the debt', /unspent|owe|command/i.test(finaleText), finaleText.slice(0, 60));

  check('zero console/page errors', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nTOKEN JOURNEY FAIL (${fail})` : '\nTOKEN JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
