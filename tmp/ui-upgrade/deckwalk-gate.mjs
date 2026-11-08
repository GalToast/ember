// Ember deck-walk clip gate — walks EVERY card of a mode at real phone viewports,
// proving no page scroll, no dock overlap, no clipped text on any card.
// Run: node tmp/ui-upgrade/deckwalk-gate.mjs   (preview server on :4173)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const MODE = process.env.MODE || 'inferno';
let fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (!cond) { failures.push(name + (detail ? ` — ${detail}` : '')); fail++; }
};

async function walk(vp, label) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  await page.locator('input').nth(0).fill('Fred');
  await page.locator('input').nth(1).fill('Christen');
  // pick mode + set safeword (worst-case L4 stack)
  await page.locator('button.mode', { hasText: MODE.charAt(0).toUpperCase() + MODE.slice(1) }).first().click();
  const sw = page.locator('input[type="password"], input[placeholder*="safe" i], .warning input');
  if (await sw.count()) await sw.first().fill('red', { timeout: 2000 }).catch(() => {});
  await page.getByText('Start the night', { exact: false }).click();
  await page.waitForTimeout(300);
  await page.getByText(/We'?re ready/i).click();
  await page.waitForTimeout(400);

  const seen = new Set();
  for (let i = 0; i < 160; i++) {
    const r = await page.evaluate(() => {
      const vh = window.innerHeight;
      const doc = document.documentElement;
      const bodyScrolls = doc.scrollHeight > vh + 1;
      const card = document.querySelector('[data-testid="card"]');
      if (!card) return { gone: true };
      const cr = card.getBoundingClientRect();
      const site = card.closest('.stage');
      const dock = document.querySelector('[data-testid="dock"]');
      const dr = dock?.getBoundingClientRect();
      const inner = card.scrollHeight - card.clientHeight; // px hidden inside card (overflow)
      const zone = card.parentElement;
      const overlapsDock = dr ? cr.bottom > dr.top - 2 : false;
      const meetsTop = cr.top >= 0;
      const text = card.querySelector('.text');
      const textClip = text ? text.scrollHeight - text.clientHeight : 0;
      const id = card.getAttribute('data-testid') && [...card.classList].join(',');
      return {
        gone: false, bodyScrolls, vh, docH: doc.scrollHeight,
        cardBottom: cr.bottom, cardTop: cr.top, dockTop: dr?.top ?? 0,
        cardInnerHidden: inner, overlapsDock, meetsTop, textClip,
        timer: !!card.querySelector('.timer'), speak: !!card.querySelector('.speak'),
        safe: !!card.querySelector('.safeword'),
      };
    });
    if (r.gone) break;
    const cardEl = await page.$('[data-testid="card"]');
    const stale = await cardEl?.textContent() || '';
    if (r.bodyScrolls) check(`${label}: card ${i} page scrolls (docH=${r.docH} > vh=${r.vh}; t=${r.timer ? 1 : 0},s=${r.speak ? 1 : 0},sw=${r.safe ? 1 : 0})`, false, stale.slice(0, 60));
    if (r.cardInnerHidden > 2) check(`${label}: card ${i} inner content hidden ${r.cardInnerHidden}px`, false, stale.slice(0, 60));
    if (r.textClip > 2) check(`${label}: card ${i} text clipped ${r.textClip}px`, false, stale.slice(0, 60));
    if (r.overlapsDock) check(`${label}: card ${i} overlaps dock (cardBottom=${Math.round(r.cardBottom)} dockTop=${Math.round(r.dockTop)})`, false, stale.slice(0, 60));
    if (!r.meetsTop) check(`${label}: card ${i} above viewport (top=${Math.round(r.cardTop)})`, false, stale.slice(0, 60));
    seen.add(stale.slice(0, 40));
    const next = page.getByTestId('next');
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(120);
  }
  check(`${label}: zero console/page errors (${errors.length})`, errors.length === 0, errors[0] || '');
  console.log(`${label}: walked ${seen.size} unique cards at ${vp.width}x${vp.height}`);
  await browser.close();
}

(async () => {
  await walk({ width: 360, height: 780 }, 'small-android'); // Samsung default zoom equivalent
  await walk({ width: 393, height: 851 }, 's23');           // S23 natural CSS pixels
  if (failures.length) {
    console.log('\nDECKWALK FAIL (' + fail + ')');
    for (const f of failures.slice(0, 40)) console.log('  ' + f);
  } else console.log('\nDECKWALK PASS — every card fits, no page scroll, no clipping, no overlap');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('deckwalk error:', e.message); process.exit(2); });
