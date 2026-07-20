# Performance notes — FX layer

Living document for the WebGL enhancement layer (`src/js/fx/`). Updated per phase.

## Phase 1 — Hero "Applied Intelligence: real-world flow" (current)

A single scene fusing the data globe (real-world messy data) with the
Vision-Transformer pipeline (applied intelligence), reading left → right:

    REAL WORLD ──stream──▶ PERCEPTION ──▶ REASONING ──▶ DECISION
    (data globe)          (photo patches) (attention)    (labels)

### Budgets
| Element | Draw calls | Vertices / prims | Notes |
|---|---|---|---|
| Data globe | 1 (`Points`) | 15,000 desktop / 9,000 mid-tier / 6,000 phones | budget in `utils/env.js` from `hardwareConcurrency` / `deviceMemory` / viewport; morph + pointer-repulsion done in the vertex shader |
| Globe rings | 2 (`Line`) | 2×121 verts | opacity-only animation |
| Photo patches | 16 meshes (+16 edge lines) | 4×4 grid (3×3 on phones) | textured planes; the profile webp swaps in over a procedural fallback |
| Token sequence + CLS + MLP nodes | 3 (`Points`) | ~20 sprites | glow shader, shared pulse-wave uniform |
| Self-attention lines | 1 (`LineSegments`) | 17×16/2 pairs, vertex-coloured | per-frame colour buffer (small) |
| Stream particles (globe→patches) | 1 (`Points`) | 60 desktop / 26 phones | per-frame position buffer |
| Readout particles (CLS→MLP→bar) | 1 (`Points`) | 9 / 5 | per-frame position buffer |
| Decision bars + tracks | ~20 meshes | scale-x animated | |
| Ambient dust | 1 (`Points`) | 90 / 40 | |
| HUD sprites (stage + class labels) | ~9 sprites | canvas textures, redrawn only on theme change | desktop only |

- **Interaction:** whole group gets pointer parallax; the globe has view-space
  pointer repulsion (analytic plane projection, no per-frame Raycaster). Hover
  over the hero raises a global `flow` multiplier (1 → 1.8); a click/tap that
  isn't on real UI arms an inference "run" — `uBoost` sweeps the pipeline and
  the decision bars re-fill from zero over ~1.6 s. Clicks on `a, button,
  .lang-switch, .scroll-cue` are ignored so navigation is never hijacked.
- Renderer: `antialias: false` (point sprites gain nothing from MSAA),
  `powerPreference: 'low-power'`, pixel ratio capped at 2.
- Per-frame buffer uploads are limited to the small dynamic sets (stream,
  readout, attention colours); the 15k globe never uploads — all its motion is
  in the shader.
- Rendering pauses when the hero scrolls off-screen (IntersectionObserver)
  and on tab blur (`visibilitychange`), and clamps `dt` to 50 ms so a
  backgrounded tab never fast-forwards on resume.
- `three.min.js` is lazy-loaded once and shared with the About/brand scenes
  (`utils/three-loader.js` reuses the tag `academic-page.js` creates).
- **Total ≈ 25–30 draw calls**, dominated by the textured patch meshes; the
  card micro-scenes in phase 3 will move to a shared scissor-test renderer.

### Fallback ladder
1. **Inline `<head>` gate** (`html[data-fx="on"]`): FX layer only activates with
   ES-module support, no `prefers-reduced-motion`, no `saveData`, and
   `deviceMemory` > 2 GB / `hardwareConcurrency` > 2. Everyone else gets the
   previous site unchanged — including the original ViT-pipeline hero scene,
   which now serves as the fallback (it renders a single static frame under
   reduced motion, as before).
2. **WebGL/context failure inside the FX layer**: canvas is hidden; the CSS
   gradient hero, veil, and all content remain.
3. **Text reveal**: split spans are `aria-hidden` with an `.sr-only` copy of
   the original text; if `js/fx/main.js` never runs, the text was never
   hidden in the first place (no FOUC risk).

### Morph readiness (phase 2 hook)
The particle shader has a single morph channel (`position` ↔ `aTarget`,
scrubbed by `uMorph`). At load `aTarget` holds the scattered intro cloud;
the scroll-morph phase re-writes that buffer after the intro so ScrollTrigger
can scrub the same uniform for the hero → About transition.

### Build
No bundler by default: FX modules ship as native ES modules copied by gulp
(`copy-fx` task) — `uglify-js` cannot parse module syntax. An opt-in Vite
config (`vite.config.mjs`, `npm run build:prod`) bundles + minifies the whole
FX module graph into a single in-place `main.js` when desired; see the README.

## Phase 1b — combined hero: scroll morph (globe → portrait → stream)

- Adds **GSAP + ScrollTrigger + Lenis** (vendored UMD, `src/js/fx/vendor/`),
  lazy-loaded only behind the gate and only by `utils/scroll.js`. ~128 KB
  min (≈ 46 KB gzipped), deferred, off the critical path.
- The globe's vertex shader gained a 3-stage morph (`uIntro`, `uSeg1`,
  `uSeg2`) over three position channels (globe / portrait / scatter). No extra
  draw calls — still one `Points`. The portrait is sampled once from the photo
  (100-px luminance grid, elliptically masked), then uploaded once.
- ScrollTrigger **pins the hero** for one extra viewport and scrubs
  `setScroll`; the ViT pipeline fades via a small material registry as the
  portrait forms, then the globe disperses. Lenis drives GSAP's ticker.
- Falls back cleanly: if any lib fails, the promise rejects and the page keeps
  **native scroll** and the hero animating in place. Reduced motion never
  loads these libs. The old hand-rolled hero-scroll effect is disabled when
  the gate is on to avoid double-driving transforms.

## Phase 2 — research cards (shared scissor-test renderer)

- **One** `WebGLRenderer` (a fixed, pointer-events-none overlay canvas) draws
  all four card scenes via `setScissor`/`setViewport` per card rect — never
  four renderers. Off-screen cards are culled by their `getBoundingClientRect`;
  the manager pauses when neither the Research nor Journey section is visible.
- Scenes: torus-knot ring (360 pts), curl-noise stream (260 pts), line-chart +
  anomaly (48-pt line + marker), node mesh (14 nodes + nearest-neighbour
  edges). Hover raises a per-card speed/glow. Placeholders (`.research-viz`)
  exist only under the gate; non-FX visitors keep the original SVG icons.

## Phase 3 — journey comet

- Rendered as a **5th scissor view in the same shared renderer** (no new
  renderer): a `CatmullRomCurve3` spine through six milestone nodes with a
  glowing comet + 10-point trail whose position tracks the Journey section's
  scroll offset; the 2026 node shimmers. The CSS timeline line/dots are hidden
  under the gate so the WebGL spine replaces them.

## Phase 4 — micro-interactions (`utils/microux.js`, DOM only)

- Magnetic buttons (lang trigger, theme toggle, `.btn`), a dot+ring custom
  cursor (fine-pointer only; first touch tears it down and restores the system
  cursor), footer icon lift-in. **Preloader** is injected by the inline
  `<head>` gate *before first paint* (no content flash); the module hides it on
  `load`, and a gate-level longstop clears it unconditionally so it can never
  trap the page. All disabled under reduced motion.

## Fallback matrix

| Condition | Result |
|---|---|
| No ES modules / low-end / save-data / reduced-motion | Gate off: original site + original ViT hero; no FX code runs |
| Gate on, WebGL context fails | Hero canvas hidden, cards/journey skipped; DOM reveals, magnetic, cursor, smooth-ish page remain; content intact |
| Gate on, scroll libs fail to load | Native scroll kept; hero animates in place; cards/journey still run |
| Tab hidden / section off-screen | Every renderer pauses (`visibilitychange` + IntersectionObserver) |

## Verifying without a browser

`src/js/fx/_smoke.mjs` (dev-only, `.mjs` so `copy-fx`'s `**/*.js` never ships
it) stubs THREE + DOM and runs hero setup + the full scroll-morph range + one
render frame, and the cards/journey manager + a frame, across
desktop/mobile × reduced/non-reduced motion. Run:

    node src/js/fx/_smoke.mjs                 # desktop, motion on
    FX_REDUCE=1 node src/js/fx/_smoke.mjs     # reduced motion
    FX_SMALL=1  node src/js/fx/_smoke.mjs     # mobile layout
