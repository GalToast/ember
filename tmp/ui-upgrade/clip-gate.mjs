// Ember clip gate — proves no text/UI clipping at phone + TV viewports.
// Run: node tmp/ui-upgrade/clip-gate.mjs   (preview server must be on :4173)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW_ROOT = process.env.PW_ROOT || 'C:/Users/HP/repos/semantic-explorer';
const { chromium } = require(PW_ROOT + '/node_modules/playwright/index.js');

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
let fail = 0;
const check = (name, cond, detail = '') => {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ` — ${detail}` : ''));
  if (!cond) fail++;
};

async function audit(page, label) {
  const m = await page.evaluate(() => {
    const vw = window.innerWidth;
    const doc = document.documentElement;
    const out = { vw, docOverflow: doc.scrollWidth - vw, issues: [] };
    const rect = (el) => el ? el.getBoundingClientRect() : null;
    const dock = document.querySelector('[data-testid="dock"]');
    if (dock) {
      const r = rect(dock);
      out.dock = { sw: dock.scrollWidth, cw: dock.clientWidth, left: r.left, right: r.right, vw };
      if (dock.scrollWidth > dock.clientWidth + 1) out.issues.push('dock internal overflow');
      if (r.left < 0 || r.right > vw) out.issues.push('dock exceeds viewport');
    }
    const chips = document.querySelector('[data-testid="decks"]');
    if (chips) {
      const r = rect(chips);
      out.chips = { sw: chips.scrollWidth, cw: chips.clientWidth, right: r.right };
      if (chips.scrollWidth > chips.clientWidth + 1) out.issues.push('chip row internal overflow');
      if (r.left < 0 || r.right > vw) out.issues.push('chip row exceeds viewport');
    }
    const card = document.querySelector('[data-testid="card"]');
    if (card) {
      const cr = rect(card);
      out.card = { top: cr.top, bottom: cr.bottom, left: cr.left, right: cr.right };
      if (cr.top < 0 || cr.bottom > window.innerHeight || cr.left < 0 || cr.right > vw) out.issues.push('card exceeds viewport');
      const badge = card.querySelector('.badge-badge');
      if (badge) {
        const br = rect(badge);
        out.badge = { top: br.top, bottom: br.bottom, left: br.left, right: br.right };
        if (br.top < cr.top || br.bottom > cr.bottom || br.left < cr.left || br.right > cr.right) out.issues.push('badge outside card bounds (clipped)');
        if (br.top < 0 || br.left < 0 || br.right > vw) out.issues.push('badge exceeds viewport');
      }
      const text = card.querySelector('.text');
      if (text && text.scrollHeight > text.clientHeight + 2) out.issues.push('card text vertically clipped');
    }
    out.bodyScrollX = document.body.scrollWidth - vw;
    return out;
  });
  check(`${label}: no horizontal document overflow`, m.docOverflow <= 0, `docOverflow=${m.docOverflow}`);
  check(`${label}: no body horizontal scroll`, m.bodyScrollX <= 0, `bodyScrollX=${m.bodyScrollX}`);
  if (m.dock) check(`${label}: dock fits`, m.issues ? !m.issues.some(i => i.includes('dock')) : true, JSON.stringify(m.dock));
  if (m.chips) check(`${label}: deck chips fit`, m.issues ? !m.issues.some(i => i.includes('chip')) : true, JSON.stringify(m.chips));
  if (m.card) {
    check(`${label}: card in viewport`, !m.issues.some(i => i.includes('card exceeds')), JSON.stringify(m.card));
    if (m.badge) check(`${label}: badge fully visible`, !m.issues.some(i => i.includes('badge')), JSON.stringify(m.badge));
    check(`${label}: card text not clipped`, !m.issues.includes('card text vertically clipped'));
  }
  return m;
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  for (const [label, vp] of [['phone', { width: 390, height: 844 }], ['tv', { width: 1280, height: 720 }]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await audit(page, `${label} setup`);

    // names + start
    await page.locator('input').nth(0).fill('Fred');
    await page.locator('input').nth(1).fill('Christen');
    await page.getByText('Start the night', { exact: false }).click();
    await page.waitForTimeout(400);
    await audit(page, `${label} splash`);
    if (label === 'phone') await page.screenshot({ path: 'tmp/ui-upgrade/phone-splash.png' });

    // begin + draw until a bomb card (max 25 draws)
    await page.getByText(/We'?re ready/i).click();
    await page.waitForTimeout(500);
    let bombSeen = false;
    for (let i = 0; i < 25; i++) {
      const isBomb = await page.locator('.card.bomb').count();
      if (isBomb) { bombSeen = true; break; }
      await audit(page, `${label} card #${i + 1}`);
      if (label === 'phone' && i < 2) await page.screenshot({ path: `tmp/ui-upgrade/phone-card${i + 1}.png` });
      await page.getByTestId('next').click();
      await page.waitForTimeout(350);
    }
    check(`${label}: bomb card reached for badge audit`, bombSeen);
    if (bombSeen) {
      await audit(page, `${label} bomb card`);
      if (label === 'phone') await page.screenshot({ path: 'tmp/ui-upgrade/phone-bomb.png' });
      else await page.screenshot({ path: 'tmp/ui-upgrade/tv-card1.png' });
    }
    check(`${label}: zero console/page errors`, errors.length === 0, errors[0] || '');
    await ctx.close();
  }
  await browser.close();
  console.log(fail ? `\nCLIP GATE FAIL (${fail})` : '\nCLIP GATE PASS');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('clip gate error:', e.message); process.exit(2); });
