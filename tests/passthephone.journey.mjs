/**
 * Ember Pass-the-Phone journey — private card reveal, handoff, turn alternation.
 * Run: node tests/passthephone.journey.mjs   (needs preview on :4173)
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
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('ptp-open').click();
  await page.waitForTimeout(600);

  // 1. private card screen shows the holder's name + sealed state
  check('private screen opens', await page.getByTestId('private-card').count() === 1);
  const holder = await page.getByTestId('pc-holder').textContent() || '';
  check('holder name shown', /Fred/.test(holder), holder);
  check('card starts sealed', await page.locator('.pcard.sealed').count() === 1);
  const cardText = await page.locator('.pc-text').count();
  check('text hidden while sealed', cardText === 0);

  // 2. press-and-hold reveals while held
  const pcard = page.locator('.pcard');
  await pcard.dispatchEvent('pointerdown');
  await page.waitForTimeout(200);
  check('holding reveals text', await page.locator('.pc-text').count() === 1 && await page.locator('.pcard.open').count() === 1);
  await pcard.dispatchEvent('pointerup');
  await page.waitForTimeout(200);
  check('release re-hides', await page.locator('.pcard.sealed').count() === 1);

  // 3. three presses latch the reveal
  for (let i = 0; i < 3; i++) { await pcard.dispatchEvent('pointerdown'); await pcard.dispatchEvent('pointerup'); await page.waitForTimeout(80); }
  await page.waitForTimeout(150);
  check('3 presses latch open', await page.locator('.pcard.open').count() === 1);

  // 4. done -> handoff screen with the OTHER player's name
  await page.getByTestId('pc-done').click();
  await page.waitForTimeout(400);
  check('handoff screen shows', await page.getByTestId('handoff').count() === 1);
  const handoffText = await page.getByTestId('handoff').textContent() || '';
  check('handoff names Christen', /Christen/.test(handoffText), handoffText.slice(0, 60));

  // 5. continue -> second private card, holder = Christen
  await page.getByTestId('handoff-continue').click();
  await page.waitForTimeout(500);
  const holder2 = await page.getByTestId('pc-holder').textContent() || '';
  check('second card holder is Christen', /Christen/.test(holder2), holder2);
  check('second card starts sealed', await page.locator('.pcard.sealed').count() === 1);

  // 6. night state is persisting turns (reload mid-ptp resumes into handoff/private)
  await page.getByTestId('pc-done').click();
  await page.waitForTimeout(500);
  await page.getByTestId('handoff').waitFor({ state: 'visible', timeout: 5000 });
  const night = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || '{}'));
  check('night persisted through ptp', night.cardId && night.count >= 1 && night.turn, `count=${night.count}`);

  // 7. exit back to play via Leave private mode
  await page.getByTestId('ptp-exit').click({ timeout: 5000 });
  await page.waitForTimeout(400);
  check('exit returns to play (normal dock)', await page.getByTestId('dock').count() === 1);

  // 8. PRIVACY: a ptp night resumed mid-handoff must NOT render the stored card publicly.
  //    Start a fresh ptp night, pass one card (handoff pending), reload, resume.
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  await page.getByTestId('ptp-open').click();
  await page.waitForTimeout(600);
  const pc = page.locator('.pcard');
  for (let i = 0; i < 3; i++) { await pc.dispatchEvent('pointerdown'); await pc.dispatchEvent('pointerup'); await page.waitForTimeout(60); }
  await page.getByTestId('pc-done').click();
  await page.waitForTimeout(500);
  // reload while the handoff is pending
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: /Resume/i }).click();
  await page.waitForTimeout(500);
  check('ptp resume lands on handoff (not a public card)', await page.getByTestId('handoff').count() === 1);
  check('ptp resume does NOT leak the private card', await page.locator('.pcard').count() === 0 && await page.getByTestId('card').count() === 0);

  check('zero console/page errors', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nPTP JOURNEY FAIL (${fail})` : '\nPTP JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
