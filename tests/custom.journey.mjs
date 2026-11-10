/**
 * Ember custom-deck journey — write, validate, persist, and confirm custom cards draw.
 * Run: node tests/custom.journey.mjs   (needs preview on :4173)
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
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('custom-open').click();
  await page.waitForTimeout(400);
  check('custom deck opens', await page.getByTestId('custom-deck').count() === 1);
  check('empty state shown', /No cards yet/.test(await page.locator('body').textContent() || ''));

  // 1. write a dare: validation should demand a soften
  await page.getByTestId('write-dare').click();
  await page.waitForTimeout(300);
  await page.getByTestId('custom-text').fill('Kiss their shoulder blade slowly while telling them one plan you have for tonight.');
  await page.waitForTimeout(250);
  let errs = await page.locator('.err').allTextContents();
  check('soften required for dares', errs.some(e => /softer/.test(e)), errs.join(';'));

  // 2. fill soften — still missing nothing else
  await page.getByTestId('custom-soften').fill('Kiss their shoulder blade slowly, no words needed.');
  await page.waitForTimeout(250);
  errs = await page.locator('.err').allTextContents();
  check('validation passes with soften', !(await page.getByTestId('custom-save').isDisabled()), errs.join(';'));

  // 3. save and see it listed
  await page.getByTestId('custom-save').click();
  await page.waitForTimeout(300);
  check('card listed after save', /Kiss their shoulder blade/.test(await page.getByTestId('custom-list').textContent() || ''));

  // 4. sense gate: a card with "my" outside quotes gets flagged
  await page.getByTestId('write-truth').click();
  await page.waitForTimeout(200);
  await page.getByTestId('custom-text').fill('Tell them my favorite thing about their hands.');
  await page.waitForTimeout(250);
  errs = await page.locator('.err').allTextContents();
  check('sense gate fires on "my"', errs.some(e => /my\/I/.test(e) || /not "my/.test(e)), errs.join(';'));

  // 5. fix it and save
  await page.getByTestId('custom-text').fill('Tell them the favorite thing about their hands — then prove it with one touch.');
  await page.waitForTimeout(250);
  await page.getByTestId('custom-save').click();
  await page.waitForTimeout(250);
  check('two custom cards now', (await page.locator('.row').count()) === 2);

  // 6. persisted in localStorage
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.custom') || '[]'));
  check('custom cards persisted', Array.isArray(stored) && stored.length === 2, String(stored.length));

  // 7. author attribution recorded
  check('author stored', stored[0].author === 'a', JSON.stringify(stored[0].author));

  // 8. custom cards are IN the draw pool: deterministic via ember.focusCustom seed hook
  await page.getByTestId('custom-close').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => localStorage.setItem('ember.focusCustom', '1'));
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);
  // UX-8: seeded nights mean Start lands on the late splash
  await page.getByTestId('begin-late').click().catch(() => page.getByTestId('begin').click());
  await page.waitForTimeout(500);
  let found = false;
  for (let i = 0; i < 6 && !found; i++) {
    const t = await page.getByTestId('card').textContent() || '';
    if (/Kiss their shoulder blade|favorite thing about their hands/.test(t)) found = true;
    else {
      if (!(await page.getByTestId('next').count())) break;
      await page.getByTestId('next').click();
      await page.waitForTimeout(80);
    }
  }
  check('custom card drew when it is the only pool left (deterministic via focusCustom)', found);

  check('zero console/page errors', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nCUSTOM JOURNEY FAIL (${fail})` : '\nCUSTOM JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
