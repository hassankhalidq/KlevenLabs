import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = 'http://localhost:4173/';
const fails = [];
const notes = [];

const browser = await chromium.launch();

/* ---------- 1. Accessibility (axe, real painted colours) ---------- */
for (const vp of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  for (const v of results.violations) {
    fails.push(
      `[a11y ${vp.name}] ${v.id} (${v.impact}): ${v.help} -> ${v.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 4)
        .join(' | ')}`,
    );
  }
  await page.close();
  await ctx.close();
}

/* ---------- 2. Content bans + structure ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  const content = await page.evaluate(() => {
    const visibleText = document.body.innerText;

    // Every user-visible string, including attributes that surface as text.
    const attrText = [...document.querySelectorAll('*')]
      .flatMap((el) => [
        el.getAttribute('alt'),
        el.getAttribute('title'),
        el.getAttribute('aria-label'),
        el.getAttribute('placeholder'),
      ])
      .filter(Boolean)
      .join(' ');
    const all = `${document.title} ${visibleText} ${attrText}`;

    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(
      (h) => `${h.tagName}: ${h.innerText.replace(/\s+/g, ' ').trim().slice(0, 46)}`,
    );

    // Eyebrow = small uppercase wide-tracked label sitting above a heading.
    const eyebrows = [...document.querySelectorAll('p,span,h3,div')].filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.textTransform !== 'uppercase') return false;
      if (parseFloat(cs.letterSpacing) < 1.4) return false;
      if (parseFloat(cs.fontSize) > 15) return false;
      if (!el.innerText.trim()) return false;
      const next = el.nextElementSibling;
      return next && /^H[1-3]$/.test(next.tagName);
    }).map((el) => el.innerText.trim());

    const imgsNoAlt = [...document.querySelectorAll('img')].filter(
      (i) => !i.hasAttribute('alt'),
    ).length;

    // Dead or placeholder destinations.
    const badHrefs = [...document.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h === '#' || h === '' || /example\.com|your-|TODO/i.test(h));

    // Anchor targets that do not exist.
    const brokenAnchors = [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h.length > 1 && !document.querySelector(h));

    // CTA labels must not wrap at desktop.
    const wrapped = [...document.querySelectorAll('.cta, .submit')]
      .filter((el) => el.getBoundingClientRect().height > 72)
      .map((el) => el.innerText.trim());

    return {
      emDash: (all.match(/—/g) || []).length,
      enDash: (all.match(/–/g) || []).length,
      emoji: (all.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length,
      lorem: /lorem ipsum/i.test(all),
      bannedWords: [
        'seamless', 'cutting-edge', 'elevate your brand', 'digital experiences',
        'passionate team', 'unleash', 'revolutionize', 'next-gen',
      ].filter((w) => new RegExp(w, 'i').test(all)),
      h1Count: document.querySelectorAll('h1').length,
      headings,
      eyebrows,
      sectionCount: document.querySelectorAll('main section').length,
      imgsNoAlt,
      badHrefs,
      brokenAnchors,
      wrapped,
      title: document.title,
    };
  });

  if (content.emDash) fails.push(`[copy] ${content.emDash} em-dash(es) in visible text`);
  if (content.enDash) fails.push(`[copy] ${content.enDash} en-dash(es) in visible text`);
  if (content.emoji) fails.push(`[copy] ${content.emoji} emoji in visible text`);
  if (content.lorem) fails.push('[copy] lorem ipsum present');
  if (content.bannedWords.length)
    fails.push(`[copy] banned agency filler: ${content.bannedWords.join(', ')}`);
  if (content.h1Count !== 1) fails.push(`[structure] h1 count is ${content.h1Count}, expected 1`);
  if (content.imgsNoAlt) fails.push(`[a11y] ${content.imgsNoAlt} img without alt`);
  if (content.badHrefs.length) fails.push(`[links] placeholder hrefs: ${content.badHrefs.join(', ')}`);
  if (content.brokenAnchors.length)
    fails.push(`[links] anchors with no target: ${content.brokenAnchors.join(', ')}`);
  if (content.wrapped.length) fails.push(`[cta] label wraps: ${content.wrapped.join(', ')}`);

  const cap = Math.ceil(content.sectionCount / 3);
  if (content.eyebrows.length > cap)
    fails.push(
      `[design] ${content.eyebrows.length} eyebrows over ${content.sectionCount} sections, cap ${cap}: ${content.eyebrows.join(' | ')}`,
    );

  notes.push(`title: ${content.title}`);
  notes.push(`sections: ${content.sectionCount}, eyebrows: ${content.eyebrows.length} (cap ${cap}) ${JSON.stringify(content.eyebrows)}`);
  notes.push(`headings:\n  ${content.headings.join('\n  ')}`);
  await page.close();
  await ctx.close();
}

/* ---------- 3. Reduced motion ---------- */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);

  const rm = await page.evaluate(() => {
    const running = document
      .getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => a.effect?.target?.className || 'unknown');
    const heroVisible = (() => {
      const el = document.querySelector('.hero-line-inner');
      if (!el) return false;
      return getComputedStyle(el).opacity === '1';
    })();
    return { running, heroVisible };
  });

  if (rm.running.length)
    fails.push(`[reduced-motion] ${rm.running.length} animation(s) still running: ${rm.running.slice(0, 5).join(', ')}`);
  if (!rm.heroVisible) fails.push('[reduced-motion] hero headline not visible');
  await page.close();
  await ctx.close();
}

/* ---------- 4. Tap targets on mobile ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('a, button, input')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { t: (el.innerText || el.name || el.tagName).trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((x) => x.h > 0 && x.h < 44),
  );
  if (small.length)
    notes.push(`tap targets under 44px high: ${small.map((s) => `${s.t} (${s.h}px)`).join(', ')}`);
  await page.close();
  await ctx.close();
}

await browser.close();

console.log('=== NOTES ===');
notes.forEach((n) => console.log(n));
console.log('\n=== FAILURES ===');
if (fails.length === 0) console.log('none');
else fails.forEach((f) => console.log(f));
