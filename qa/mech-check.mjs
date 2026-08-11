import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

// What ScrollTriggers actually registered, and are the pins real?
const triggers = await page.evaluate(() => {
  const ST = window.ScrollTrigger;
  return ST
    ? ST.getAll().map((t) => ({
        trigger: t.trigger?.className || '?',
        start: Math.round(t.start),
        end: Math.round(t.end),
        pin: !!t.pin,
      }))
    : 'ScrollTrigger not on window';
});
console.log('ScrollTriggers:', JSON.stringify(triggers, null, 2));

// Walk the process section and watch the path actually draw.
const top = await page.evaluate(
  () => document.querySelector('.process-steps').getBoundingClientRect().top + window.scrollY,
);
console.log('\nprocess dashoffset by scroll position:');
for (const off of [-700, -300, 0, 300, 700, 1100]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, top + off));
  await page.waitForTimeout(650);
  const v = await page.evaluate(() => {
    const p = document.querySelector('.process-path');
    return p ? getComputedStyle(p).strokeDashoffset : 'missing';
  });
  console.log(`  offset ${String(off).padStart(5)} -> dashoffset ${v}`);
}

await page.screenshot({ path: 'qa/shots/_mech-process.png' });
await browser.close();
