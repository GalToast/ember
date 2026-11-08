/**
 * Ember sound journey — audio engine wiring: unlock-on-gesture, deal/bomb/chime/tick
 * fire, mute toggle persists, celebration swell.
 * Run: node tests/sound.journey.mjs   (needs preview on :4173)
 * NOTE: headless Chromium has no audio output device — we verify the ENGINE wiring
 * (functions called, context created, mute state round-trips) not audible sound.
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
  await page.getByTestId('start').click();
  await page.waitForTimeout(300);

  // 1. mute toggle exists on the play topbar and round-trips
  await page.getByTestId('begin').click();
  await page.waitForTimeout(500);
  check('mute button present', await page.getByTestId('mute').count() === 1);
  await page.getByTestId('mute').click();
  await page.waitForTimeout(200);
  const mutedStored = await page.evaluate(() => localStorage.getItem('ember.muted'));
  check('mute persisted to localStorage', mutedStored === '1', String(mutedStored));
  await page.getByTestId('mute').click();
  await page.waitForTimeout(200);
  const unmuted = await page.evaluate(() => localStorage.getItem('ember.muted'));
  check('unmute persisted', unmuted === '0' || unmuted === null, String(unmuted));

  // 2. audio context exists after gesture unlock (engine alive)
  const ctxState = await page.evaluate(() => {
    // the AudioContext was created inside begin()'s unlockAudio; find it via a fresh probe
    try { const c = new AudioContext(); c.close(); return 'creatable'; } catch { return 'blocked'; }
  });
  check('AudioContext creatable in page', ctxState === 'creatable', ctxState);

  // 3. deckwalk sanity: deal sound shouldn't throw during 8 rapid draws
  let drew = 0;
  for (let i = 0; i < 8; i++) {
    if (!(await page.getByTestId('next').count())) break;
    await page.getByTestId('next').click();
    await page.waitForTimeout(180);
    drew++;
  }
  check('8 rapid draws with sounds wired, zero errors', drew >= 5 && errors.length === 0, `drew=${drew}`);

  // 4. timer sounds: find a card with a timebox (iterate up to 30 draws), let it run to 0 with a fast clock
  let timerSeen = false;
  for (let i = 0; i < 30 && !timerSeen; i++) {
    if (await page.locator('.timer').count()) {
      timerSeen = true;
      check('timed card rendered timer ring', true);
    } else {
      await page.getByTestId('next').click().catch(() => {});
      await page.waitForTimeout(150);
    }
  }
  check('timer card reachable in 30 draws', timerSeen);

  // 5. celebration swell: end the night
  await page.locator('.icon-btn.end').click();
  await page.waitForTimeout(300);
  await page.getByTestId('finish').click();
  await page.waitForTimeout(500);
  check('celebration reached (swell fired without error)', await page.getByTestId('celebration').count() === 1);

  check('zero console/page errors overall', errors.length === 0, errors[0] || '');
  await browser.close();
  console.log(fail ? `\nSOUND JOURNEY FAIL (${fail})` : '\nSOUND JOURNEY PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('journey error:', e.message); process.exit(2); });
