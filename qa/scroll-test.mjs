import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const OUT = 'qa/shots';
const problems = [];

const browser = await chromium.launch();

for (const vp of [
  { name: 'desktop', width: 1440, height: 900, stops: 14 },
  { name: 'mobile', width: 390, height: 844, stops: 10 },
]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${vp.name}] console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`${vp.name}: page height ${height}px (${(height / vp.height).toFixed(1)} viewports)`);

  for (let i = 0; i < vp.stops; i += 1) {
    const y = Math.round((height - vp.height) * (i / (vp.stops - 1)));
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/r3-${vp.name}-${String(i).padStart(2, '0')}.png` });
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) problems.push(`[${vp.name}] horizontal overflow ${overflow}px`);

  await page.close();
}

await browser.close();
console.log('\nPROBLEMS:', problems.length ? '\n' + problems.join('\n') : 'none');
