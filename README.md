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

Four locked colours, defined in `src/styles/tokens.css`. Everything else on the
page is one of them at an alpha, never a new hue and never a neutral grey.

| Token      | Value     | Role                                    |
| ---------- | --------- | --------------------------------------- |
| `--ink`    | `#0D0D0D` | Base background                         |
| `--signal` | `#F2C230` | Identity colour, used generously        |
| `--ember`  | `#C1361F` | Accent, at most one moment per section  |
| `--paper`  | `#F7F5EF` | The single off-white block              |

Type: Bricolage Grotesque (display), Hanken Grotesk (body), JetBrains Mono
(labels). All three are self-hosted from `public/fonts/` as latin-subset
variable fonts, 197KB total, preloaded.

Corner radius is zero everywhere by design.

## QA

```bash
node qa/audit.mjs   # axe WCAG 2.1 AA, copy bans, heading order, reduced motion
node qa/shot.mjs    # screenshots at 1440 / 834 / 390, checks for overflow
node qa/prod-check.mjs https://kleven-labs.vercel.app   # verify the live site
```

Both need `npm run preview` running first. They are dev-only; if you want a
leaner deploy install, remove `playwright`, `@axe-core/playwright` and
`axe-core` from devDependencies.

Current state: axe reports no WCAG 2.1 A/AA violations at desktop or mobile.
