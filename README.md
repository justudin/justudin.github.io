# academic-page
- Tailwind v2 and Javascript were used to create a single academic page that displayed publications from ORCID and Crossref. 
- [Profile Card](https://github.com/tailwindtoolbox/Profile-Card) was used as a starting point.
- The publication data is independently pulled from ORCID and Crossref. So, please add your publication to the ORCID website at https://orcid.org.
- You need to have NodeJS: https://nodejs.org/en/installed on your computer in order to run the `npm` command.

![Academic-Page](academic-page-demo.gif)

# DEMO

LIVE: https://academic-page.pages.dev (Hosted on Pages, FREE, Thanks to Cloudflare!)

# How to
Use this template: https://github.com/justudin/academic-page/generate and make few 3 changes:

- In `src/img` https://github.com/justudin/academic-page/tree/main/src/img : change the images as you wish but please mantain the filename as the same.
```
background_{1,2,3} <- for the background images
profile_mobile <- for the profile picture shows in the mobile device
profile_desktop <- for the profile picture shows in the desktop
```

- In `src/js/academic-page.js` https://github.com/justudin/academic-page/blob/main/src/js/academic-page.js : Change the ORCID with your ID
```
const YOUR_ORCID = "0000-0002-5640-4413"; // change this value with your actual ORCID

``` 

- In `src/index.html` : change your name, biography, links, etc as you wish.

Finally, run the following commands to install the dependencies and build the website:

- To install the dependencies
```
npm install 
```

- To build the website
```
npm run build
```

The generated site is placed in the `docs/` folder (served on GitHub Pages), where you can copy/upload the files to any static host — Cloudflare Pages, GitHub Pages, and so on.

---

# Interactive FX layer (Three.js / WebGL)

On top of the static, SEO-complete HTML the site ships a progressive
**enhancement layer** (`src/js/fx/`) that turns the page into an immersive
Three.js experience — *without* changing the underlying semantic markup, so
screen readers, search engines, and no-JS visitors see exactly the same
content they always did.

## Design principle: a gate, not a rewrite

An inline script in each page's `<head>` sets `html[data-fx="on"]` **only** when
the browser supports ES modules and is not in `prefers-reduced-motion`, not on
`save-data`, and not obviously low-end (`deviceMemory`/`hardwareConcurrency`).
When the flag is absent, **none of the FX code runs** and the page is byte-for-
byte the original site (including its original Vision-Transformer hero, which
now doubles as the fallback). Everything below is additive and reversible.

## What it adds

1. **Hero — "Applied Intelligence: real-world flow."** A rotating point-cloud
   data globe (the messy real world) sheds particles that stream into the
   profile photo, which is patchified, embedded, attended over, and read out as
   multi-label decisions — the ViT pipeline. Pointer parallax + globe
   repulsion; hover accelerates the flow; click/tap re-runs inference.
2. **Scroll morph.** GSAP ScrollTrigger pins the hero and scrubs a 3-stage
   vertex-shader morph — globe → a point-cloud portrait sampled from the photo
   → dispersed data stream — while Lenis drives smooth scrolling.
3. **Research cards.** Four live micro-visualizations (torus-knot, curl-noise
   stream, anomaly line-chart, node mesh) drawn by **one** shared renderer via
   the scissor test. Hover speeds each up.
4. **Journey comet.** A glowing comet travels a `CatmullRomCurve3` spine through
   the timeline milestones, tracking scroll; the 2026 node shimmers.
5. **Micro-interactions.** Magnetic buttons, a dot+ring custom cursor, an
   "M·S" preloader (injected before first paint, always self-clears), and
   footer icon lift-ins.

Colours in every scene react to the existing light/dark theme toggle (they read
the `--scene-*` CSS variables and re-skin on the `aint:theme` event). All
rendering pauses off-screen and on tab-blur.

## File structure

```
src/js/fx/
  main.js              entry (boots only behind the gate)
  scenes/  hero.js     data-globe + ViT pipeline + scroll morph
           cards.js    shared scissor renderer: 4 cards + journey comet
  shaders/ hero-particles.js   GLSL (globe morph + glow sprites)
  utils/   env.js theme.js three-loader.js scroll.js reveal.js microux.js
  vendor/  gsap.min.js ScrollTrigger.min.js lenis.min.js   (lazy-loaded)
  _smoke.mjs           dev-only headless test (never shipped)
```

## Run / build / deploy

```bash
npm install            # dependencies
npm run build          # Tailwind + gulp  →  docs/   (default shipping build)
npm run serve          # preview docs/ locally
npm run deploy         # push docs/ subtree to gh-pages
```

The default `npm run build` copies the FX layer as native ES modules — it works
everywhere and keeps the deploy exactly as before.

### Optional: bundle + minify the FX layer with Vite

`vite.config.mjs` bundles the whole FX module graph into a single minified
`docs/js/fx/main.js` **in place** (still an ES module at the same path, so the
HTML `<script type="module">` tag is unchanged and rollback is just re-running
gulp):

```bash
npm i -D vite
npm run build:prod     # gulp, then Vite overwrites docs/js/fx/main.js
```

## Verifying the WebGL layer headlessly

```bash
node src/js/fx/_smoke.mjs                # desktop, motion on
FX_REDUCE=1 node src/js/fx/_smoke.mjs    # reduced motion
FX_SMALL=1  node src/js/fx/_smoke.mjs    # mobile layout
```

See `PERFORMANCE.md` for draw-call budgets and the full fallback matrix.

# License
MIT