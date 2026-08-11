import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const fails = [];
const notes = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => fails.push(`pageerror: ${e.message}`));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);

/* ---------- 1. Anchor navigation (Lenis intercepts scrolling) ---------- */
for (const [label, sel, target] of [
  ['nav Work', '.nav-links a[href="#work"]', '#work'],
  ['nav Process', '.nav-links a[href="#process"]', '#process'],
  ['nav CTA', '.nav-cta', '#contact'],
  ['hero CTA', '.hero .cta', '#contact'],
]) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.click(sel);
  await page.waitForTimeout(2200); // generous: smooth scroll needs to finish

  const r = await page.evaluate((t) => {
    const el = document.querySelector(t);
    return {
      top: Math.round(el.getBoundingClientRect().top),
      scrollY: Math.round(window.scrollY),
      max: Math.round(document.documentElement.scrollHeight - window.innerHeight),
    };
  }, target);

  notes.push(
    `${label} -> ${target} landed at top=${r.top}px (scrollY ${r.scrollY}, max ${r.max})`,
  );
  const atBottom = r.scrollY >= r.max - 2;
  if (Math.abs(r.top) > 90 && !atBottom) {
    fails.push(`${label}: ${target} is ${r.top}px from viewport top, expected near 0`);
  }
}

/* ---------- 2. Skip link ---------- */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await page.evaluate(() => {
  document.activeElement?.blur();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(400);
await page.keyboard.press('Tab');
await page.waitForTimeout(450); // the reveal is a 220ms transition
const skip = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return {
    cls: el.className,
    text: el.innerText?.trim(),
    transform: cs.transform,
    outline: cs.outlineWidth,
    onScreen: el.getBoundingClientRect().top >= 0,
  };
});
notes.push(`first Tab -> "${skip.text}" (${skip.cls}) transform=${skip.transform}`);
if (!skip.cls.includes('skip')) fails.push(`first Tab focused "${skip.cls}", expected skip link`);
if (!skip.onScreen) fails.push(`skip link still off screen when focused (${skip.transform})`);

/* ---------- 3. Keyboard traversal + focus visibility ---------- */
const seen = [];
let missingOutline = 0;
for (let i = 0; i < 22; i += 1) {
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 30),
      label: (el.innerText || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 26),
      outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
      offscreen: r.width === 0 && r.height === 0,
    };
  });
  if (!info) break;
  seen.push(`${info.tag}${info.cls ? '.' + info.cls.split(' ')[0] : ''}:${info.label}`);
  if (!info.outline && !info.offscreen) missingOutline += 1;
}
notes.push(`tab order (${seen.length}): ${seen.join(' > ')}`);
if (missingOutline > 0) fails.push(`${missingOutline} focused element(s) had no visible outline`);

/* ---------- 4. Contact form ---------- */
await page.evaluate(() => document.querySelector('#contact').scrollIntoView());
await page.waitForTimeout(1200);

// 4a. empty submit
await page.click('.submit');
await page.waitForTimeout(400);
const empty = await page.evaluate(() => ({
  errors: [...document.querySelectorAll('.field-error')].map((e) => e.innerText.trim()),
  invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.id),
  described: [...document.querySelectorAll('.field-input')].map((e) => e.getAttribute('aria-describedby')),
}));
notes.push(`empty submit -> errors: ${JSON.stringify(empty.errors)}`);
if (empty.errors.length !== 3) fails.push(`empty submit produced ${empty.errors.length} errors, expected 3`);
if (empty.invalid.length !== 3) fails.push(`aria-invalid set on ${empty.invalid.length}/3 fields`);
if (empty.described.some((d) => !d)) fails.push('a field with an error is missing aria-describedby');

// 4b. bad email
await page.fill('#name', 'Ayesha Rahman');
await page.fill('#email', 'ayesha@');
await page.fill('#project', 'Rebuild our booking flow.');
await page.click('.submit');
await page.waitForTimeout(400);
const bad = await page.evaluate(() => ({
  errors: [...document.querySelectorAll('.field-error')].map((e) => e.innerText.trim()),
  invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.id),
}));
notes.push(`bad email -> errors: ${JSON.stringify(bad.errors)} on ${JSON.stringify(bad.invalid)}`);
if (bad.invalid.length !== 1 || bad.invalid[0] !== 'email')
  fails.push(`bad email flagged ${JSON.stringify(bad.invalid)}, expected only email`);

// 4c. error clears on edit
await page.fill('#email', 'ayesha@studio.com');
await page.waitForTimeout(250);
const cleared = await page.evaluate(() => document.querySelectorAll('.field-error').length);
if (cleared !== 0) fails.push(`error did not clear on retype (${cleared} remain)`);

// 4d. valid submit reaches mailto
let mailto = null;
page.on('request', (r) => {
  if (r.url().startsWith('mailto:')) mailto = r.url();
});
await page.evaluate(() => {
  window.__nav = null;
  const d = Object.getOwnPropertyDescriptor(window.location, 'href');
  if (!d || d.configurable) {
    try {
      delete window.location.href;
    } catch { /* ignore */ }
  }
});
await page.click('.submit');
await page.waitForTimeout(900);
const sent = await page.evaluate(() => ({
  sentPanel: !!document.querySelector('.contact-sent'),
  text: document.querySelector('.contact-sent')?.innerText.replace(/\s+/g, ' ').trim(),
}));
notes.push(`valid submit -> confirmation shown: ${sent.sentPanel} | mailto fired: ${!!mailto}`);
if (!sent.sentPanel) fails.push('valid submit did not show the confirmation state');

/* ---------- 5. Marquee pauses on hover ---------- */
await page.evaluate(() => document.querySelector('.marquee').scrollIntoView());
await page.waitForTimeout(700);
await page.hover('.marquee');
await page.waitForTimeout(300);
const paused = await page.evaluate(
  () => getComputedStyle(document.querySelector('.marquee-track')).animationPlayState,
);
notes.push(`marquee on hover: ${paused}`);
if (paused !== 'paused') fails.push(`marquee did not pause on hover (${paused})`);

await page.close();
await ctx.close();
await browser.close();

console.log('=== NOTES ===');
notes.forEach((n) => console.log(n));
console.log('\n=== FAILURES ===');
console.log(fails.length ? fails.join('\n') : 'none');
