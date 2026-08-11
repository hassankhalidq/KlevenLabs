import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const fails = [];
const warns = [];
const notes = [];

const browser = await chromium.launch();

/* ---------- 1. Web Vitals: LCP and cumulative layout shift ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__cls = 0;
    window.__shifts = [];
    window.__lcp = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (!e.hadRecentInput) {
          window.__cls += e.value;
          if (e.value > 0.01) {
            window.__shifts.push({
              v: +e.value.toFixed(4),
              t: Math.round(e.startTime),
              src: (e.sources || [])
                .map((s) => s.node?.className || s.node?.tagName || '?')
                .slice(0, 2),
            });
          }
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1);
      if (e) window.__lcp = Math.round(e.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3200);
  // Scroll the page: pins and refreshes are a classic late-CLS source.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let i = 1; i <= 14; i += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round((h - 900) * (i / 14)));
    await page.waitForTimeout(280);
  }
  const v = await page.evaluate(() => ({
    cls: +window.__cls.toFixed(4),
    shifts: window.__shifts.slice(0, 6),
    lcp: window.__lcp,
  }));
  notes.push(`LCP ${v.lcp}ms | CLS ${v.cls}`);
  if (v.shifts.length) notes.push(`  shifts: ${JSON.stringify(v.shifts)}`);
  if (v.cls > 0.1) fails.push(`CLS ${v.cls} exceeds 0.1`);
  else if (v.cls > 0.05) warns.push(`CLS ${v.cls} is above the 0.05 comfort line`);
  if (v.lcp > 2500) fails.push(`LCP ${v.lcp}ms exceeds 2500ms`);
  await page.close();
  await ctx.close();
}

/* ---------- 2. WCAG 1.4.12 text spacing ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  await page.addStyleTag({
    content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important; }
      p { margin-bottom: 2em !important; }`,
  });
  await page.waitForTimeout(900);
  const clipped = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,li,span')) {
      const cs = getComputedStyle(el);
      if (cs.overflow === 'visible' || el.closest('.marquee')) continue;
      if (el.scrollHeight > el.clientHeight + 4 || el.scrollWidth > el.clientWidth + 4) {
        out.push(
          `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`,
        );
      }
    }
    return [...new Set(out)].slice(0, 8);
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  notes.push(`text-spacing overrides -> clipped: ${clipped.length ? clipped.join(', ') : 'none'}, overflow ${overflow}px`);
  if (overflow > 0) fails.push(`text-spacing caused ${overflow}px horizontal overflow`);
  await page.screenshot({ path: 'qa/shots/_text-spacing.png' });
  await page.close();
  await ctx.close();
}

/* ---------- 3. Resize mid-pin, and rapid scrolling ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  // Park inside the hero pin, then resize under it.
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 900, height: 700 });
  await page.waitForTimeout(1200);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1200);

  const afterResize = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    heroVisible: getComputedStyle(document.querySelector('.hero-word-inner')).opacity,
    panels: document.querySelectorAll('.service-panel').length,
  }));
  if (afterResize.overflow > 0) fails.push(`resize mid-pin left ${afterResize.overflow}px overflow`);
  if (afterResize.panels !== 3) fails.push('service panels lost after resize');

  // Rapid jumps, the way an impatient visitor drags the scrollbar.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (const f of [0.9, 0.1, 0.75, 0.2, 1, 0]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(h * f));
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1400);
  const afterRapid = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    heroOpacity: getComputedStyle(document.querySelector('.hero-body')).opacity,
    scrollY: Math.round(window.scrollY),
  }));
  notes.push(`after resize + rapid scroll: overflow=${afterRapid.overflow} heroOpacity=${afterRapid.heroOpacity} y=${afterRapid.scrollY}`);
  if (afterRapid.overflow > 0) fails.push(`rapid scroll left ${afterRapid.overflow}px overflow`);
  // Back at the top the hero must be legible again, not stuck faded out.
  if (afterRapid.scrollY < 20 && Number(afterRapid.heroOpacity) < 0.9) {
    fails.push(`hero stuck at opacity ${afterRapid.heroOpacity} after scrolling back to top`);
  }
  if (errs.length) fails.push(`errors during resize/rapid scroll: ${errs.slice(0, 3).join(' | ')}`);
  await page.close();
  await ctx.close();
}

/* ---------- 4. Meta / SEO ---------- */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const meta = await page.evaluate(() => {
    const m = (n) =>
      document.querySelector(`meta[name="${n}"]`)?.content ||
      document.querySelector(`meta[property="${n}"]`)?.content ||
      null;
    return {
      lang: document.documentElement.lang,
      title: document.title,
      description: m('description'),
      viewport: m('viewport'),
      themeColor: m('theme-color'),
      ogTitle: m('og:title'),
      ogDesc: m('og:description'),
      ogImage: m('og:image'),
      favicon: document.querySelector('link[rel~="icon"]')?.href || null,
      h1Count: document.querySelectorAll('h1').length,
    };
  });
  notes.push(`meta: lang=${meta.lang} title=${meta.title.length}ch desc=${meta.description?.length}ch og:image=${meta.ogImage ?? 'none'}`);
  if (!meta.lang) fails.push('no lang on <html>');
  if (!meta.description) fails.push('no meta description');
  if (meta.title.length > 62) warns.push(`title is ${meta.title.length} chars, search results truncate near 60`);
  if ((meta.description?.length ?? 0) > 160) warns.push(`meta description is ${meta.description.length} chars, truncates near 160`);
  if (!meta.ogImage) warns.push('no og:image, so shared links render without a preview card');
  await page.close();
  await ctx.close();
}

/* ---------- 5. No-JS ---------- */
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const text = (await page.evaluate(() => document.body.innerText)) || '';
  notes.push(`no-JS body text: ${text.trim().length} chars`);
  if (text.trim().length < 40) {
    warns.push('with JS disabled the page renders nothing (client-rendered SPA, no prerender)');
  }
  await page.close();
  await ctx.close();
}

await browser.close();

console.log('=== NOTES ===');
notes.forEach((n) => console.log(n));
console.log('\n=== WARNINGS ===');
console.log(warns.length ? warns.join('\n') : 'none');
console.log('\n=== FAILURES ===');
console.log(fails.length ? fails.join('\n') : 'none');
