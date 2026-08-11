import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const fails = [];
const notes = [];

// 320 is the WCAG 1.4.10 reflow floor. 1440x620 is the "short laptop" case
// where a full-viewport hero has least room. 2560 checks the max-width holds.
const VIEWS = [
  [320, 640, 'iPhone SE / reflow floor'],
  [360, 740, 'small Android'],
  [390, 844, 'iPhone 14'],
  [430, 932, 'iPhone Pro Max'],
  [768, 1024, 'iPad portrait'],
  [834, 1112, 'iPad Air'],
  [1024, 768, 'iPad landscape'],
  [1280, 800, 'small laptop'],
  [1440, 620, 'short laptop'],
  [1440, 900, 'desktop'],
  [1920, 1080, 'large desktop'],
  [2560, 1440, 'ultrawide'],
];

const browser = await chromium.launch();

for (const [w, h, label] of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const id = `${w}x${h} (${label})`;
  page.on('pageerror', (e) => fails.push(`[${id}] pageerror: ${e.message.slice(0, 120)}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2700);

  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;

    // Any element sticking out past the viewport is a layout bug, even if the
    // body itself is clipped and hides it.
    const wide = [...document.querySelectorAll('main *, header *, footer *')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) return false;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return false;
        // The marquee track is intentionally wider than the viewport.
        if (el.closest('.marquee')) return false;
        return rect.right > doc.clientWidth + 2 || rect.left < -2;
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);

    const nav = document.querySelector('.nav-inner');
    const navLinks = document.querySelector('.nav-links');
    const navRect = nav.getBoundingClientRect();
    const linkTops = [...navLinks.querySelectorAll('a')]
      .map((a) => a.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => Math.round(r.top));
    const navMultiline = new Set(linkTops).size > 1;

    // Hero must deliver headline + CTA without scrolling.
    const cta = document.querySelector('.hero .cta').getBoundingClientRect();
    const h1 = document.querySelector('h1').getBoundingClientRect();

    return {
      overflow,
      wide,
      navHeight: Math.round(navRect.height),
      navMultiline,
      heroCtaBottom: Math.round(cta.bottom),
      heroH1Top: Math.round(h1.top),
      ctaInView: cta.bottom <= innerHeight + 1 && cta.top >= 0,
      h1InView: h1.top >= 0 && h1.bottom <= innerHeight + 1,
      pageHeight: doc.scrollHeight,
    };
  });

  notes.push(
    `${id.padEnd(34)} nav=${r.navHeight}px h1InView=${r.h1InView} ctaInView=${r.ctaInView} ctaBottom=${r.heroCtaBottom}/${h} page=${r.pageHeight}`,
  );

  if (r.overflow > 0) fails.push(`[${id}] horizontal overflow ${r.overflow}px`);
  if (r.wide.length) fails.push(`[${id}] elements past viewport: ${r.wide.join(', ')}`);
  if (r.navMultiline) fails.push(`[${id}] nav wrapped to multiple lines`);
  if (r.navHeight > 80) fails.push(`[${id}] nav is ${r.navHeight}px, cap is 80`);
  if (!r.ctaInView) fails.push(`[${id}] hero CTA not visible without scrolling (bottom ${r.heroCtaBottom} vs ${h})`);
  if (!r.h1InView) fails.push(`[${id}] hero headline does not fit the viewport`);

  await page.screenshot({ path: `qa/shots/rs-${w}x${h}.png` });
  await page.close();
  await ctx.close();
}

await browser.close();
console.log('=== NOTES ===');
notes.forEach((n) => console.log(n));
console.log('\n=== FAILURES ===');
console.log(fails.length ? fails.join('\n') : 'none');
