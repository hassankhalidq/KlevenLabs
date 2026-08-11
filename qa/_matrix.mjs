import { chromium, firefox, webkit } from 'playwright';
const BASE = process.argv[2] ?? 'http://localhost:5173/';
const engines = { chromium, firefox, webkit };
const cases = [
  ['chromium 1440x900', 'chromium', {width:1440,height:900}, {}],
  ['chromium 1536x864', 'chromium', {width:1536,height:864}, {}],
  ['chromium 1280x720', 'chromium', {width:1280,height:720}, {}],
  ['chromium reduced', 'chromium', {width:1440,height:900}, {reducedMotion:'reduce'}],
  ['chromium touch',   'chromium', {width:1440,height:900}, {hasTouch:true, isMobile:true}],
  ['firefox 1440x900', 'firefox',  {width:1440,height:900}, {}],
  ['webkit 1440x900',  'webkit',   {width:1440,height:900}, {}],
];
for (const [label, eng, viewport, opts] of cases) {
  const b = await engines[eng].launch();
  const ctx = await b.newContext({ viewport, ...opts });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0,90)));
  try {
    await p.goto(BASE, { waitUntil:'networkidle', timeout:40000 });
    await p.waitForTimeout(3200);
    const pre = await p.evaluate(() => ({
      h: document.documentElement.scrollHeight,
      loading: document.documentElement.classList.contains('is-loading'),
      curtain: !!document.querySelector('.curtain'),
      htmlOv: getComputedStyle(document.documentElement).overflow,
      bodyOv: getComputedStyle(document.body).overflow,
    }));
    await p.mouse.move(400,400);
    for (let i=0;i<5;i++){ await p.mouse.wheel(0,500); await p.waitForTimeout(200); }
    const y = await p.evaluate(() => Math.round(window.scrollY));
    console.log(`${label.padEnd(20)} h=${String(pre.h).padStart(6)} loading=${pre.loading?'YES':'no '} curtain=${pre.curtain?'YES':'no '} htmlOv=${pre.htmlOv} bodyOv=${pre.bodyOv} -> scrollY=${y} ${y>5?'OK':'*** FROZEN ***'}${errs.length?' ERR:'+errs[0]:''}`);
  } catch(e){ console.log(`${label.padEnd(20)} threw: ${e.message.slice(0,80)}`); }
  await b.close();
}
