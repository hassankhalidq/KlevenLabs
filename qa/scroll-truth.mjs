import { chromium } from 'playwright';

/**
 * Does the page actually scroll?
 *
 * Deliberately does NOT use window.scrollTo to move the page, because that is
 * exactly what hid this bug the first time: a harness can drive scrollTo, take
 * different screenshots, and still tell you nothing about whether a human
 * turning a wheel gets anywhere. Real wheel events, then poll scrollY over time.
 */
const BASE = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(3200); // well past the curtain

const before = await page.evaluate(() => ({
  scrollY: window.scrollY,
  docH: document.documentElement.scrollHeight,
  viewportH: window.innerHeight,
  htmlClass: document.documentElement.className,
  bodyClass: document.body.className,
  htmlOverflow: getComputedStyle(document.documentElement).overflow,
  bodyOverflow: getComputedStyle(document.body).overflow,
  htmlPosition: getComputedStyle(document.documentElement).position,
  bodyHeight: getComputedStyle(document.body).height,
  scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  curtainPresent: !!document.querySelector('.curtain'),
}));
console.log('BEFORE:', JSON.stringify(before, null, 2));

// 1. Real wheel input.
console.log('\n--- real wheel events ---');
const wheelTrace = [];
for (let i = 0; i < 8; i += 1) {
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(220);
  wheelTrace.push(await page.evaluate(() => Math.round(window.scrollY)));
}
console.log('scrollY after each wheel tick:', wheelTrace.join(' -> '));
const wheelMoved = wheelTrace.at(-1) > 5;

// 2. Programmatic scroll, as a second opinion.
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(900);
const afterScrollTo = await page.evaluate(() => Math.round(window.scrollY));
console.log('after window.scrollTo(0, 3000):', afterScrollTo);

// 3. Keyboard, the third independent path.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.keyboard.press('End');
await page.waitForTimeout(1200);
const afterEnd = await page.evaluate(() => Math.round(window.scrollY));
console.log('after End key:', afterEnd);

console.log('\nRESULT');
console.log('  wheel scrolls:      ', wheelMoved ? 'YES' : 'NO  <-- BROKEN');
console.log('  scrollTo works:     ', afterScrollTo > 5 ? 'YES' : 'NO  <-- BROKEN');
console.log('  keyboard works:     ', afterEnd > 5 ? 'YES' : 'NO  <-- BROKEN');
if (errors.length) console.log('  console errors:', errors.slice(0, 4).join(' | '));

await browser.close();
