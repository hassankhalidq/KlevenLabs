import { chromium, firefox, webkit } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const fails = [];
const notes = [];

const ENGINES = [
  ['chromium', chromium],
  ['firefox', firefox],
  ['webkit', webkit],
];

for (const [name, engine] of ENGINES) {
  let browser;
  try {
    browser = await engine.launch();
  } catch (e) {
    fails.push(`[${name}] failed to launch: ${e.message}`);
    continue;
  }

  for (const vp of [
    { label: 'desktop', width: 1440, height: 900 },
    { label: 'mobile', width: 390, height: 844 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const id = `${name}/${vp.label}`;

    page.on('console', (m) => {
      if (m.type() === 'error') fails.push(`[${id}] console: ${m.text().slice(0, 160)}`);
    });
    page.on('pageerror', (e) => fails.push(`[${id}] pageerror: ${e.message.slice(0, 160)}`));
    page.on('response', (r) => {
      if (r.status() >= 400) fails.push(`[${id}] ${r.status()} ${r.url().slice(0, 90)}`);
    });

    try {
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(3000);

      const r = await page.evaluate(async () => {
        await document.fonts.ready;
        const q = (s) => document.querySelector(s);
        const canvas = q('.hero-media canvas');
        let painted = false;
        if (canvas) {
          try {
            const c = canvas.getContext('2d');
            const d = c.getImageData(0, 0, canvas.width, canvas.height).data;
            let lit = 0;
            for (let i = 3; i < d.length; i += 4 * 200) if (d[i] > 8) lit += 1;
            painted = lit > 20;
          } catch { painted = 'blocked'; }
        }
        const cs = (s, p) => (q(s) ? getComputedStyle(q(s))[p] : 'missing');
        return {
          title: document.title,
          h1: q('h1')?.innerText.replace(/\s+/g, ' ').trim(),
          curtainGone: !q('.curtain'),
          painted,
          // fonts.check() returns true even for an absent family, because it
          // accounts for fallback. The loaded FontFace list is definitive.
          fontOk: [...document.fonts].some(
            (f) => f.family === 'Manrope' && f.status === 'loaded',
          ),
          h1Family: getComputedStyle(q('h1')).fontFamily,
          ctaBg: cs('.cta', 'backgroundColor'),
          panels: document.querySelectorAll('.service-panel').length,
          marqueeAnim: cs('.marquee-track', 'animationName'),
          navBlur: cs('.nav', 'backdropFilter'),
          heroMinH: cs('.hero', 'minHeight'),
          clipSupport: CSS.supports('clip-path', 'inset(50% 0% 0% 0%)'),
          dvhSupport: CSS.supports('height', '100dvh'),
          pageHeight: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      notes.push(
        `[${id}] h=${r.pageHeight} canvas=${r.painted} font=${r.fontOk} cta=${r.ctaBg} panels=${r.panels} clip=${r.clipSupport} dvh=${r.dvhSupport} marquee=${r.marqueeAnim}`,
      );

      if (!r.curtainGone) fails.push(`[${id}] curtain never cleared`);
      if (r.painted !== true) fails.push(`[${id}] hero canvas not painted (${r.painted})`);
      if (!r.fontOk) fails.push(`[${id}] Manrope did not load`);
      if (!/Manrope/.test(r.h1Family)) fails.push(`[${id}] h1 not set in Manrope: ${r.h1Family}`);
      if (r.ctaBg !== 'rgb(244, 196, 48)') fails.push(`[${id}] CTA bg wrong: ${r.ctaBg}`);
      if (r.panels !== 3) fails.push(`[${id}] expected 3 service panels, got ${r.panels}`);
      if (!r.clipSupport) fails.push(`[${id}] clip-path unsupported`);
      if (r.overflow > 0) fails.push(`[${id}] horizontal overflow ${r.overflow}px`);
      if (!r.h1?.startsWith('Built like a product.'))
        fails.push(`[${id}] h1 text wrong: "${r.h1}"`);

      // Scroll the whole page and confirm nothing throws or overflows en route.
      const steps = 12;
      for (let i = 1; i <= steps; i += 1) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round((r.pageHeight - vp.height) * (i / steps)));
        await page.waitForTimeout(320);
      }
      const overflowAfter = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflowAfter > 0) fails.push(`[${id}] overflow after scroll: ${overflowAfter}px`);

      await page.screenshot({ path: `qa/shots/xb-${name}-${vp.label}.png` });
    } catch (e) {
      fails.push(`[${id}] threw: ${e.message.slice(0, 160)}`);
    }

    await page.close();
    await ctx.close();
  }
  await browser.close();
}

console.log('=== NOTES ===');
notes.forEach((n) => console.log(n));
console.log('\n=== FAILURES ===');
console.log(fails.length ? fails.join('\n') : 'none');
