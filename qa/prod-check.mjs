import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const URL = process.argv[2] ?? 'https://kleven-labs.vercel.app';
const problems = [];
const notes = [];

const browser = await chromium.launch();

for (const vp of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();

  const failedRequests = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${vp.name}] console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));

  const resp = await page.goto(URL, { waitUntil: 'networkidle' });
  notes.push(`[${vp.name}] HTTP ${resp.status()}`);
  await page.waitForTimeout(3000);

  failedRequests.forEach((f) => problems.push(`[${vp.name}] request failed: ${f}`));

  const checks = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].map((f) => `${f.family}:${f.status}`);

    // Did the brand faces actually load, or did we fall back to a system sans?
    const h1 = document.querySelector('h1');
    const usedFamily = getComputedStyle(h1).fontFamily;
    // The loaded FontFace list is definitive; fonts.check() returns true even
    // for a family that is not there, because it accounts for fallback.
    const manropeOk = [...document.fonts].some(
      (f) => f.family === 'Manrope' && f.status === 'loaded',
    );
    const h1Family = getComputedStyle(h1).fontFamily;

    // Is the hero canvas actually painting, or is it a blank element?
    const canvas = document.querySelector('.hero-media canvas');
    let canvasPainted = false;
    let canvasSize = null;
    if (canvas) {
      canvasSize = `${canvas.width}x${canvas.height}`;
      const c = canvas.getContext('2d');
      const d = c.getImageData(0, 0, canvas.width, canvas.height).data;
      let lit = 0;
      for (let i = 3; i < d.length; i += 4 * 200) if (d[i] > 8) lit += 1;
      canvasPainted = lit > 20;
    }

    return {
      fontCount: loaded.length,
      loaded,
      usedFamily,
      manropeOk,
      h1Family,
      canvasPainted,
      canvasSize,
      title: document.title,
      h1: h1?.innerText.replace(/\s+/g, ' ').trim(),
      heroCtaBg: getComputedStyle(document.querySelector('.cta')).backgroundColor,
      workCanvases: document.querySelectorAll('.work-frame canvas').length,
    };
  });

  if (!checks.manropeOk) problems.push(`[${vp.name}] Manrope did not load`);
  if (!/Manrope/.test(checks.h1Family))
    problems.push(`[${vp.name}] h1 not set in Manrope: ${checks.h1Family}`);
  if (!checks.canvasPainted) problems.push(`[${vp.name}] hero canvas is blank`);
  if (checks.heroCtaBg !== 'rgb(244, 196, 48)')
    problems.push(`[${vp.name}] CTA background is ${checks.heroCtaBg}, expected rgb(244, 196, 48)`);

  notes.push(
    `[${vp.name}] Manrope loaded=${checks.manropeOk} h1=${checks.h1Family} | canvas ${checks.canvasSize} painted=${checks.canvasPainted} | work canvases=${checks.workCanvases}`,
  );

  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  axe.violations.forEach((v) =>
    problems.push(`[a11y ${vp.name}] ${v.id}: ${v.help}`),
  );

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) problems.push(`[${vp.name}] horizontal overflow ${overflow}px`);

  await page.screenshot({ path: `qa/shots/prod-${vp.name}.png` });
  await page.close();
  await ctx.close();
}

await browser.close();

console.log('=== NOTES ===');
notes.forEach((n) => console.log(n));
console.log('\n=== PROBLEMS ===');
console.log(problems.length ? problems.join('\n') : 'none');
