# Klevon Labs

Studio homepage. Single page, React + Vite + Framer Motion, hand-written CSS.

```bash
npm install
npm run dev      # local
npm run build    # production build into dist/
npm run preview  # serve the build on :4173
```

## What still needs real assets

Three things in here are deliberate stand-ins. Each is isolated so replacing it
touches one place.

**1. Hero background.** The brief specifies a motion-graphics loop; no footage
existed yet, so the hero renders a generated drafting field on a `<canvas>`.
To ship real footage, swap the canvas inside `.hero-media` in
`src/sections/Hero.jsx` for a `<video muted loop playsInline poster="...">`.
The scrim, layout and load sequence are independent of it and stay as they are.
Ship a lighter loop or a poster-only fallback under `768px`.

**2. Work stills.** `PROJECTS` in `src/sections/Work.jsx` has an `image` slot per
project, currently `null`, which falls back to a generated field rather than
faking a screenshot. Drop files in `public/work/` and set:

```js
image: '/work/sable.jpg',
alt: 'Sable lookbook, home page',
```

Frames are `4:5`, so export at roughly `1200x1500`.

**3. Project names.** Only `Ballast` came from the brief. `Sable`, `Meridian`
and `Cadence` are placeholders following the same one-word convention. Replace
them with the real names.

Also confirm `hassankhalidq@gmail.com`, used in `src/sections/Contact.jsx` and
`src/sections/Footer.jsx`. The contact form has no backend: it validates, then
hands off to the visitor's mail client. Replace the body of `handleSubmit` to
post to a real endpoint.

Social links are omitted from the footer rather than pointed at placeholder
profiles. Add them once the real handles exist.

## Design system

Aligned to **Brand Guidelines edition 01.2**. Token names use the guide's own
vocabulary so the code can be checked against the PDF without translation.
Everything lives in `src/styles/tokens.css`.

| Token      | Value     | Guide name    | Role                                   |
| ---------- | --------- | ------------- | -------------------------------------- |
| `--ink`    | `#111111` | Ink           | Base background                        |
| `--yellow` | `#F4C430` | Klevon Yellow | Identity colour, used generously       |
| `--lab`    | `#EFEEE9` | Lab           | The single off-white block             |
| `--alert`  | `#D7263D` | Alert         | Accent, at most one moment per section |

Every other colour on the page is one of those four at an alpha. No fifth hue,
and no neutral grey.

**Open question:** the guidelines (p.16) give Alert as `#D7263D`; the standalone
brand board gives `#BD0808`. `#D7263D` is in use as the working value because it
comes from the fuller document. Changing `--alert` updates every accent moment
on the page at once.

Type is **Manrope** throughout, self-hosted as one 25KB variable file. Weights
per guide p.17-18: ExtraBold 800 display and H1, Semibold 600 H2, Regular 400
body, Bold 700 uppercase for labels. The guide's point sizes (44/28/18/10/7) are
a document spec, so the scale keeps their *relationships* rather than the literal
values, and adds a viewport-scale `--t-hero` step above Display for the one
headline that has to work full-bleed.

The **open frame** (guide p.20) is the brand's graphic device: one yellow
bracket per composition, on the 12-column grid. It anchors the hero, drawn on
load. `src/components/OpenFrame.jsx`.

Corner radius is zero everywhere by design.

### Assets still needed from the brand owner

- **The symbol / logo SVG.** The guide forbids rebuilding the mark (p.14), and
  the asset is not in this repo. The nav and footer therefore use the approved
  *wordmark* variant (p.10, no.04) set in Manrope, and `public/favicon.svg` is
  set type rather than a reconstruction of the symbol. Both should be replaced
  with the official SVG.


## Motion

Three libraries, split by job. Don't blur the line.

- **Lenis** for smooth scroll site-wide, driven by GSAP's ticker so there is one
  rAF loop rather than two fighting each other. `src/lib/motion.js`.
- **GSAP + ScrollTrigger** for the heavy scroll mechanics only: the hero pin,
  the services mask-wipe, the process line draw.
- **Framer Motion** for the light interactive layer: the magnetic CTA, hover
  states, the grouped fade reveals in the calm sections.

Pacing alternates heavy and calm the whole way down, and no two pinned sections
touch. If you add or reorder a section, keep that true.

Every mechanic has three paths: desktop, mobile (no pin, no scrub, simplified),
and reduced motion (mechanics off, page fully readable). `gsap.matchMedia()`
with the `DESKTOP` / `MOBILE` / `ANIMATED` queries in `src/lib/motion.js` picks
between them and handles its own teardown.

Every animated value defaults to its *finished* state in CSS, so a branch that
never runs leaves content visible rather than stuck at opacity 0.

## QA

```bash
node qa/audit.mjs   # axe WCAG 2.1 AA, copy bans, heading order, reduced motion
node qa/shot.mjs    # screenshots at 1440 / 834 / 390, checks for overflow
node qa/prod-check.mjs https://kleven-labs.vercel.app   # verify the live site
node qa/scroll-test.mjs      # screenshots down the full page, desktop + mobile
node qa/perf.mjs '' 4        # frame times under 4x CPU throttle while scrolling
node qa/reduced-motion.mjs   # confirms every mechanic is off and page is readable
node qa/mech-check.mjs http://localhost:5173/   # ScrollTrigger + line draw (dev server)
node qa/qa-browsers.mjs      # Chromium, Firefox and WebKit, desktop + mobile
node qa/qa-functional.mjs    # anchors, skip link, tab order, form, marquee
node qa/qa-responsive.mjs    # 12 viewports, 320 to 2560, hero fit and overflow
node qa/qa-robustness.mjs    # LCP/CLS, WCAG text spacing, resize mid-pin, meta, no-JS
node qa/make-og.mjs          # regenerate public/og.jpg from the live hero
```

All need `npm run preview` running first, except `mech-check`, which needs
`npm run dev`. They are dev-only; if you want a
leaner deploy install, remove `playwright`, `@axe-core/playwright` and
`axe-core` from devDependencies.

Current state: axe reports no WCAG 2.1 A/AA violations at desktop or mobile.
