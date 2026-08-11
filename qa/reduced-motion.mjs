import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const fails = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const page = await ctx.newPage();
page.on('pageerror', (e) => fails.push(`pageerror: ${e.message}`));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

const r = await page.evaluate(() => {
  const vis = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false };
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      found: true,
      opacity: cs.opacity,
      display: cs.display,
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    };
  };

  const panels = [...document.querySelectorAll('.service-panel')].map((el) => {
    const cs = getComputedStyle(el);
    return { position: cs.position, clipPath: cs.clipPath, h: Math.round(el.getBoundingClientRect().height) };
  });

  return {
    running: document.getAnimations().filter((a) => a.playState === 'running').length,
    curtainGone: !document.querySelector('.curtain'),
    heroWord: vis('.hero-word-inner'),
    heroSub: vis('.hero-sub'),
    cta: vis('.cta'),
    marqueeTrack: getComputedStyle(document.querySelector('.marquee-track')).animationName,
    marqueeDupHidden:
      getComputedStyle(document.querySelector('.marquee-strip[aria-hidden="true"]')).display,
    panels,
    processDash: getComputedStyle(document.querySelector('.process-path')).strokeDashoffset,
    pageHeight: document.documentElement.scrollHeight,
    // Lenis adds this class to <html> when it initialises.
    lenisActive: document.documentElement.classList.contains('lenis'),
  };
});

console.log(JSON.stringify(r, null, 2));

if (r.running > 0) fails.push(`${r.running} animation(s) still running`);
if (!r.curtainGone) fails.push('curtain never cleared');
if (r.heroWord.opacity !== '1') fails.push('hero headline not fully visible');
if (r.cta.opacity !== '1') fails.push('CTA not visible');
if (r.marqueeTrack !== 'none') fails.push(`marquee still animating (${r.marqueeTrack})`);
if (r.lenisActive) fails.push('Lenis smooth scroll active under reduced motion');
if (r.processDash !== '0px') fails.push(`process line not drawn (dashoffset ${r.processDash})`);
r.panels.forEach((p, i) => {
  if (p.position === 'absolute') fails.push(`service panel ${i} still absolutely stacked`);
  if (p.clipPath !== 'none') fails.push(`service panel ${i} still clipped (${p.clipPath})`);
});

await page.screenshot({ path: 'qa/shots/_reduced-motion.png' });
await page.close();
await ctx.close();
await browser.close();

console.log('\nFAILURES:', fails.length ? '\n' + fails.join('\n') : 'none');
