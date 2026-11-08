import { readFileSync, writeFileSync } from 'node:fs';
let t = readFileSync('tests/release.journey.mjs', 'utf8');
// popover flow: star tap opens; gift works from popover; holder-note test now checks popover content
t = t.replace("check('gift + keep buttons visible for holder', await page.getByTestId('release-gift').count() === 1 && await page.getByTestId('release-spend').count() === 1);",
"await page.getByTestId('release').click();\n  await page.waitForTimeout(300);\n  check('popover opens with gift + keep', await page.getByTestId('release-pop').count() === 1 && await page.getByTestId('release-gift').count() === 1);");
t = t.replace("await page.getByTestId('release-gift').click();", "await page.getByTestId('release-gift').click();\n  await page.waitForTimeout(200);\n  await page.getByTestId('release').click(); // toggle popover closed (state reset)");
t = t.replace("check('holder note shows for non-holder', await page.getByTestId('release-note').count() === 1, (await page.getByTestId('release-note').textContent() || ''));",
"await page.getByTestId('release').click(); await page.waitForTimeout(200);\n  check('popover shows non-holder note', await page.getByTestId('release-pop').count() === 1 && /holds/.test(await page.getByTestId('release-pop').textContent() || ''), (await page.getByTestId('release-pop').textContent() || ''));\n  await page.getByTestId('release').click(); await page.waitForTimeout(200);");
// spend flow: need popover open on holder's turn
t = t.replace("      if (await page.getByTestId('release-spend').count()) {\n        await page.getByTestId('release-spend').click();",
"      if (await page.getByTestId('release').count()) { await page.getByTestId('release').click(); await page.waitForTimeout(200); }\n      if (await page.getByTestId('release-spend').count()) {\n        await page.getByTestId('release-spend').click();");
writeFileSync('tests/release.journey.mjs', t);
console.log('popover flow wired into test');
