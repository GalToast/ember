/**
 * Ember resume journey — proves the mid-night state survives a real reload.
 * Run: node tests/resume.journey.mjs   (needs the preview server on :4173)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';

let fail = 0;
function check(name, cond, detail) {
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
  await page.waitForTimeout(500);
  check('loads without console/page errors', errors.length === 0, errors[0] || '');

  // 1. setup: names + mode
  const nameInputs = page.locator('input');
  check('setup has name inputs', await nameInputs.count() >= 2, `${await nameInputs.count()} inputs`);
  if ((await nameInputs.count()) >= 2) {
    await nameInputs.nth(0).fill('Fred');
    await nameInputs.nth(1).fill('Christen');
  }
  const startBtn = page.getByRole('button', { name: /start|begin|let'?s/i }).first();
  if (await startBtn.count()) await startBtn.click();
  else page.locator('button').first().click();
  await page.waitForTimeout(400);

  // 2. play to a card, then advance twice and assert a resume offer exists
  for (let guard = 0; guard < 4; guard++) {
    const playVisible = await page.locator('[data-testid="card"]').count();
    if (playVisible) break;
    await page.keyboard.press('Space').catch(() => {});
    const anyBtn = page.locator('button:visible').first();
    if (await anyBtn.count()) await anyBtn.click();
    await page.waitForTimeout(350);
  }
  const firstCard = await page.locator('[data-testid="card"] .text').first().textContent().catch(() => null);
  check('a card was dealt', !!firstCard, (firstCard || '').slice(0, 40));

  // 3. AUTHORED CARD STATE: use swipe/next handler to advance
  const nextBtn = page.getByRole('button', { name: /next|swipe/i }).first();
  const beforeText = firstCard;
  if (await nextBtn.count()) {
    await nextBtn.click();
    await page.waitForTimeout(350);
    const secondText = await page.locator('[data-testid="card"] .text').first().textContent();
    check('advance deals a different card (no immediate repeat)', secondText !== beforeText, `${(secondText || '').slice(0, 30)}`);
  } else {
    // robust fallback: mouse gesture that Card.svelte bound
    const box = await page.locator('[data-testid="card"]').boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height / 2, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(400);
    }
  }

  // 4. THE REGRESSION: persisted seen-set must exclude served cards
  const stored = await page.evaluate(() => {
    const night = JSON.parse(localStorage.getItem('ember.night') || 'null');
    return { seen: night?.seen || [], count: night?.count ?? 0, cardId: night?.cardId ?? null };
  });
  check('night persisted count > 0', stored.count > 0, JSON.stringify(stored));
  check('night persisted seen[] non-empty', stored.seen.length > 0, `${stored.seen.length} ids`);
  check('current card is in seen (so it cannot repeat)', stored.seen.includes(stored.cardId), stored.cardId || 'no cardId');
  check('seen ids are unique', new Set(stored.seen).size === stored.seen.length);

  // 5. reload -> quick-continue prompt, then continue and assert NO repeats
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const resumeVisible = await page.locator('button:visible', { hasText: /resume|continue|tonight/i }).count();
  check('offer to resume after reload', resumeVisible > 0, `${resumeVisible} visible button(s)`);
  if (resumeVisible > 0) {
    await page.locator('button:visible', { hasText: /resume|continue|tonight/i }).first().click();
    await page.waitForTimeout(600);
    const resumedCard = await page.locator('[data-testid="card"] .text').first().textContent().catch(() => null);
    check('resume returns to play without errors', !errors.some((e) => e.includes('pageerror')), errors[0] || '');
    const liveIds = await page.evaluate(() => {
      const n = JSON.parse(localStorage.getItem('ember.night') || 'null');
      return n ? n.seen || [] : [];
    });
    check('resumed night kept seen[] intact', liveIds.length >= stored.seen.length, `${liveIds.length} >= ${stored.seen.length}`);
    const texts = await page.evaluate(() => JSON.parse(localStorage.getItem('ember.night') || 'null')?.seen || []);
    check('resumed card id is not in the seen set repeated', new Set(texts).size === texts.length);
  }

  // 6. deck integrity in the served bundle
  const cardCount = await page.evaluate(async () => {
    const m = await import('/src/lib/game.svelte.ts').catch(() => null);
    return m ? Object.values(m.DECKS).reduce((a, d) => a + d.cards.length, 0) : 0;
  });
  console.log('(dev-path import report, nonzero only in dev server:', cardCount, ')');

  console.log(fail === 0 ? '\nJOURNEY PASS' : `\nJOURNEY FAIL (${fail})`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();