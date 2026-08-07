import { chromium } from 'playwright';

const OUT = process.argv[2] ?? 'qa/shots';
const BASE = 'http://localhost:4173/';

const VIEWS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];

// Where to park the scroll for each capture, as a fraction of full page height.
const STOPS = [
  { name: '1-hero', at: 0 },
  { name: '2-manifesto-services', at: 0.14 },
  { name: '3-work', at: 0.34 },
  { name: '4-process', at: 0.55 },
  { name: '5-paper', at: 0.72 },
  { name: '6-contact-footer', at: 0.93 },
];

const browser = await chromium.launch();
const problems = [];

for (const view of VIEWS) {
  const page = await browser.newPage({
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: 1,
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[${view.name}] console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[${view.name}] pageerror: ${err.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600); // curtain lift + font settle + hero sequence

  const height = await page.evaluate(() => document.body.scrollHeight);

  for (const stop of STOPS) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(height * stop.at));
    await page.waitForTimeout(900); // reveals are 620ms
    await page.screenshot({ path: `${OUT}/${view.name}-${stop.name}.png` });
  }

  // Horizontal overflow check: the page body must never scroll sideways.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) problems.push(`[${view.name}] horizontal overflow: ${overflow}px`);

  await page.close();
}

await browser.close();

if (problems.length) {
  console.log('PROBLEMS:\n' + problems.join('\n'));
} else {
  console.log('No console errors, no horizontal overflow.');
}
