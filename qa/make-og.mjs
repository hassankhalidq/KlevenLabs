import { chromium } from 'playwright';

/**
 * Renders the social share card from the real hero at 1200x630, so the preview
 * is the actual site rather than a mock of it. Re-run after any hero change:
 *   npm run preview & node qa/make-og.mjs
 */
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
await page.goto(process.argv[2] ?? 'http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3200);

// The nav and scroll cue are navigation furniture, not part of a share card.
await page.addStyleTag({
  content: '.nav, .hero-cue, .grain { display: none !important; }',
});
await page.waitForTimeout(400);

await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 88 });
console.log('wrote public/og.jpg (1200x630 @2x)');
await browser.close();
