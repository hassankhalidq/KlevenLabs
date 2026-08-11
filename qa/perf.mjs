import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const RATE = Number(process.argv[3] ?? 4);

const browser = await chromium.launch();
const results = [];

for (const vp of [
  { name: 'desktop', width: 1440, height: 900, wheel: true },
  { name: 'mobile', width: 390, height: 844, wheel: false, touch: true },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: !!vp.touch,
    isMobile: !!vp.touch,
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  // Throttle only after load, so we measure scrolling rather than boot.
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    window.__frames = [];
    let last = performance.now();
    const tick = (now) => {
      window.__frames.push([now - last, window.scrollY]);
      last = now;
      window.__raf = requestAnimationFrame(tick);
    };
    window.__raf = requestAnimationFrame(tick);
  });

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const steps = 44;
  const per = Math.round((height - vp.height) / steps);

  for (let i = 0; i < steps; i += 1) {
    if (vp.wheel) {
      // Real wheel events, so Lenis's smoothing is actually exercised.
      await page.mouse.wheel(0, per);
    } else {
      await page.evaluate((d) => window.scrollBy(0, d), per);
    }
    await page.waitForTimeout(90);
  }

  const raw = await page.evaluate(() => {
    cancelAnimationFrame(window.__raf);
    return window.__frames.slice(6);
  });
  const frames = raw.map((f) => f[0]);
  const spikes = raw
    .filter((f) => f[0] > 50)
    .map((f) => `${Math.round(f[0])}ms @ y=${Math.round(f[1])}`);
  if (spikes.length) console.log(`  ${vp.name} spikes: ${spikes.join(', ')}`);
  const marks = await page.evaluate(() => {
    const o = {};
    for (const sel of ['.hero', '.marquee', '.services', '.work', '.process', '.region-paper', '.contact']) {
      const el = document.querySelector(sel);
      if (el) o[sel] = Math.round(el.getBoundingClientRect().top + window.scrollY);
    }
    return o;
  });
  console.log(`  ${vp.name} section offsets:`, JSON.stringify(marks));

  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.close();
  await ctx.close();

  const sorted = [...frames].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.floor(sorted.length * p)] ?? 0;
  // At 4x throttle a 60fps budget is unrealistic; the meaningful question is
  // whether frames spike into visible-stutter territory.
  const jank = frames.filter((f) => f > 50).length;
  const bad = frames.filter((f) => f > 100).length;

  results.push({
    view: vp.name,
    frames: frames.length,
    medianMs: +pct(0.5).toFixed(1),
    p95Ms: +pct(0.95).toFixed(1),
    worstMs: +Math.max(...frames).toFixed(1),
    over50ms: jank,
    over100ms: bad,
    jankPct: +((jank / frames.length) * 100).toFixed(1),
  });
}

await browser.close();

console.log(`CPU throttle ${RATE}x\n`);
for (const r of results) {
  console.log(
    `${r.view.padEnd(8)} frames=${String(r.frames).padStart(4)}  median=${String(r.medianMs).padStart(5)}ms  p95=${String(r.p95Ms).padStart(6)}ms  worst=${String(r.worstMs).padStart(6)}ms  >50ms=${r.over50ms} (${r.jankPct}%)  >100ms=${r.over100ms}`,
  );
}
