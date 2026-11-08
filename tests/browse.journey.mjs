/**
 * Ember Browse-mode journey — real-browser check of the deck browser.
 * Run: node tests/browse.journey.mjs   (needs preview on :4173)
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
  await page.waitForTimeout(400);

  // 1. Browse is reachable from setup WITHOUT filling names (browse ≠ play)
  await page.getByTestId('browse-open').click();
  check('browse opens from setup', await page.getByTestId('browse').count() === 1);
  check('browse decks row present', await page.getByTestId('browse-decks').count() === 1);

  // 2. Default deck renders a card
  const cardText = await page.getByTestId('browse-card').textContent();
  check('card renders', !!cardText && cardText.length > 10, (cardText || '').slice(0, 40));
  check('position shows 1 /', (await page.locator('.pos').textContent() || '').includes('1 /'));

  // 3. Deck switching works and resets position
  await page.locator('.dchip', { hasText: 'Inferno' }).click();
  await page.waitForTimeout(200);
  const infernoText = await page.getByTestId('browse-card').textContent();
  check('inferno deck loads', !!infernoText && infernoText.length > 10);
  check('adult deck chip styled', await page.locator('.dchip.adult.on').count() >= 1);

  // 4. Next/prev navigation with wraparound
  await page.getByTestId('browse-controls').locator('button', { hasText: 'Next' }).click();
  await page.waitForTimeout(150);
  check('next advances', (await page.locator('.pos').textContent() || '').trim().startsWith('2'));
  await page.getByTestId('browse-controls').locator('button', { hasText: 'Prev' }).click();
  await page.waitForTimeout(150);
  check('prev returns', (await page.locator('.pos').textContent() || '').trim().startsWith('1'));

  // 5. Soften toggle renders the softer variant
  const softenBtn = page.getByTestId('browse-controls').locator('button', { hasText: 'Soften' });
  if (await softenBtn.isEnabled()) {
    const before = await page.getByTestId('browse-card').textContent();
    await softenBtn.click();
    await page.waitForTimeout(150);
    const after = await page.getByTestId('browse-card').textContent();
    check('soften changes text', before !== after);
    await page.getByTestId('browse-controls').locator('button', { hasText: 'Back up' }).click();
  } else {
    check('soften disabled on card without soften (valid state)', true);
  }

  // 6. Never-again retirement persists to localStorage
  const cardId1 = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.v1') || '{}').retired?.length || 0);
  await page.getByTestId('browse-controls').locator('button', { hasText: 'Never again' }).click();
  await page.waitForTimeout(200);
  check('retire marks card', (await page.getByTestId('browse-card').textContent() || '').includes('retired'));
  const cardId2 = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.v1') || '{}').retired?.length || 0);
  check('retirement persisted', cardId2 === cardId1 + 1, `${cardId1} -> ${cardId2}`);

  // reload and confirm it survived
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('browse-open').click();
  await page.waitForTimeout(300);
  const stillRetired = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.v1') || '{}').retired?.length || 0);
  check('retirement survives reload', stillRetired === cardId2, `${stillRetired} == ${cardId2}`);

  // 7. Restore un-retires
  await page.getByTestId('browse-controls').locator('button', { hasText: 'Restore' }).click();
  await page.waitForTimeout(200);
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.v1') || '{}').retired?.length || 0);
  check('restore un-retires', restored === cardId1, `${restored} == ${cardId1}`);

  // 8. Close returns to setup; night state untouched (no ember.night key created)
  await page.getByTestId('browse-close').click();
  await page.waitForTimeout(200);
  check('close returns to setup', await page.getByTestId('start').count() === 1);
  const night = await page.evaluate(() => localStorage.getItem('ember.night'));
  check('browse never touches night state', night === null, String(night));

  // 9. layout: no horizontal overflow at phone width
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal overflow', overflow <= 0, `docOverflow=${overflow}`);

  check('zero console/page errors', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nBROWSE JOURNEY FAIL (${fail})` : '\nBROWSE JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
