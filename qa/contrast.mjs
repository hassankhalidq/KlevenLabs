import { chromium } from 'playwright';

/**
 * Contrast for elements axe cannot evaluate.
 *
 * The service panels are stacked and clip-path'd to nothing until their scroll
 * segment arrives, so an automated pass treats them as invisible and skips
 * them. That is how a failing ink-on-yellow label can sit in a clean report.
 * This resolves alpha against the real panel background and does the maths.
 */
const BASE = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

const results = await page.evaluate(() => {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const over = (fg, bg) => {
    const a = fg.length > 3 ? fg[3] : 1;
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const out = [];
  const check = (label, sel, bgSel, largeText) => {
    const el = document.querySelector(sel);
    const bgEl = document.querySelector(bgSel);
    if (!el || !bgEl) return out.push({ label, error: 'not found' });
    const fg = parse(getComputedStyle(el).color);
    const bg = parse(getComputedStyle(bgEl).backgroundColor);
    const size = parseFloat(getComputedStyle(el).fontSize);
    const weight = Number(getComputedStyle(el).fontWeight);
    // WCAG "large" = 24px+, or 18.66px+ when bold.
    const isLarge = largeText ?? (size >= 24 || (size >= 18.66 && weight >= 700));
    const need = isLarge ? 3 : 4.5;
    const r = ratio(over(fg, bg), bg);
    out.push({
      label,
      size: Math.round(size),
      weight,
      ratio: +r.toFixed(2),
      need,
      pass: r >= need,
    });
  };

  check('yellow panel: name', '.service-panel-yellow .service-name', '.service-panel-yellow');
  check('yellow panel: line', '.service-panel-yellow .service-line', '.service-panel-yellow');
  check('yellow panel: tag', '.service-panel-yellow .service-tag', '.service-panel-yellow');
  check('lab panel: name', '.service-panel-lab .service-name', '.service-panel-lab');
  check('lab panel: line', '.service-panel-lab .service-line', '.service-panel-lab');
  check('lab panel: tag', '.service-panel-lab .service-tag', '.service-panel-lab');
  check('manifesto line', '.manifesto-line', '.manifesto');
  check('contact: Let us talk', '.contact-title-2', 'body');
  check('footer promise', '.footer-promise', 'body');
  return out;
});

console.log('element'.padEnd(28), 'size'.padStart(5), 'wt'.padStart(4), 'ratio'.padStart(7), 'need'.padStart(5), '  verdict');
let failed = 0;
for (const r of results) {
  if (r.error) { console.log(r.label.padEnd(28), r.error); continue; }
  if (!r.pass) failed += 1;
  console.log(
    r.label.padEnd(28),
    String(r.size).padStart(5),
    String(r.weight).padStart(4),
    String(r.ratio).padStart(7),
    String(r.need).padStart(5),
    '  ' + (r.pass ? 'pass' : 'FAIL'),
  );
}
console.log('\n' + (failed ? `${failed} FAILING` : 'all pass'));
await browser.close();
