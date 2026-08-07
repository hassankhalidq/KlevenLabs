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
    const bricolageOk = document.fonts.check('700 100px "Bricolage Grotesque"');
    const hankenOk = document.fonts.check('400 16px "Hanken Grotesk"');
    const monoOk = document.fonts.check('500 12px "JetBrains Mono"');

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
      bricolageOk,
      hankenOk,
      monoOk,
      canvasPainted,
      canvasSize,
      title: document.title,
      h1: h1?.innerText.replace(/\s+/g, ' ').trim(),
      heroCtaBg: getComputedStyle(document.querySelector('.cta')).backgroundColor,
      workCanvases: document.querySelectorAll('.work-frame canvas').length,
    };
  });

  if (!checks.bricolageOk) problems.push(`[${vp.name}] Bricolage Grotesque did not load`);
  if (!checks.hankenOk) problems.push(`[${vp.name}] Hanken Grotesk did not load`);
  if (!checks.monoOk) problems.push(`[${vp.name}] JetBrains Mono did not load`);
  if (!checks.canvasPainted) problems.push(`[${vp.name}] hero canvas is blank`);
  if (checks.heroCtaBg !== 'rgb(242, 194, 48)')
    problems.push(`[${vp.name}] CTA background is ${checks.heroCtaBg}, expected rgb(242, 194, 48)`);

  notes.push(
    `[${vp.name}] fonts ok: bricolage=${checks.bricolageOk} hanken=${checks.hankenOk} mono=${checks.monoOk} | canvas ${checks.canvasSize} painted=${checks.canvasPainted} | work canvases=${checks.workCanvases}`,
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
