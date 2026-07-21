/* Headless smoke test (dev-only, not shipped). Stubs THREE + DOM enough to
   run buildHeroScene through setup and one render frame, catching runtime
   API-usage / reference errors when no browser is available.
   Run: node src/js/fx/_smoke.mjs */

// ---- tiny math ----
class V3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new V3(this.x, this.y, this.z); }
    lerpVectors(a, b, t) { this.x = a.x + (b.x - a.x) * t; this.y = a.y + (b.y - a.y) * t; this.z = a.z + (b.z - a.z) * t; return this; }
    lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; }
    distanceToSquared(v) { const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z; return dx * dx + dy * dy + dz * dz; }
}
class V2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    set(x, y) { this.x = x; this.y = y; return this; }
    lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; return this; }
}
class Color {
    constructor(c) { this.r = 1; this.g = 1; this.b = 1; if (c) this.set(c); }
    set(c) { if (typeof c === 'string' && c[0] === '#') { const n = parseInt(c.slice(1), 16); this.r = ((n >> 16) & 255) / 255; this.g = ((n >> 8) & 255) / 255; this.b = (n & 255) / 255; } else if (c && c.r !== undefined) this.copy(c); return this; }
    copy(c) { this.r = c.r; this.g = c.g; this.b = c.b; return this; }
    clone() { const x = new Color(); x.copy(this); return x; }
    setScalar(v) { this.r = this.g = this.b = v; return this; }
    lerp(c, t) { this.r += (c.r - this.r) * t; this.g += (c.g - this.g) * t; this.b += (c.b - this.b) * t; return this; }
    getHexString() { const h = (v) => ('0' + Math.round(v * 255).toString(16)).slice(-2); return h(this.r) + h(this.g) + h(this.b); }
}
const attr = (array, item = 1) => ({ array, itemSize: item, needsUpdate: false, setUsage() { return this; }, setXY() { return this; } });
class Geo {
    constructor() { this._a = {}; }
    setAttribute(n, a) { this._a[n] = a; return this; }
    getAttribute(n) { return this._a[n]; }
    setFromPoints(pts) { this._a.position = attr(new Float32Array(pts.length * 3), 3); return this; }
    translate() { return this; }
}
const obj3 = () => ({ position: new V3(), rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1, set() { }, setScalar() { } }, add() { }, userData: {}, getWorldPosition(v) { return v.copy(this.position); } });
const withMat = (material) => Object.assign(obj3(), { material, geometry: null });

const THREE = {
    AdditiveBlending: 2, NormalBlending: 1, DoubleSide: 2, DynamicDrawUsage: 35048, LinearFilter: 1006,
    Color, Vector2: V2, Vector3: V3,
    BufferGeometry: Geo,
    BufferAttribute: function (array, item) { return attr(array, item); },
    PlaneGeometry: function () { const g = new Geo(); g.setAttribute('uv', attr(new Float32Array(8), 2)); return g; },
    EdgesGeometry: function () { return new Geo(); },
    ShaderMaterial: function (o) { this.uniforms = o.uniforms; this.blending = 1; this.needsUpdate = false; this.transparent = true; this.userData = {}; },
    LineBasicMaterial: function (o = {}) { Object.assign(this, o); this.color = new Color(); this.userData = {}; },
    MeshBasicMaterial: function (o = {}) { Object.assign(this, o); this.color = new Color(); this.userData = {}; },
    SpriteMaterial: function (o = {}) { Object.assign(this, o); this.color = new Color(); this.userData = {}; },
    PointsMaterial: function (o = {}) { Object.assign(this, o); this.color = new Color(); this.userData = {}; },
    Points: function (geo, mat) { const o = withMat(mat); o.geometry = geo; return o; },
    Line: function (geo, mat) { const o = withMat(mat); o.geometry = geo; return o; },
    LineSegments: function (geo, mat) { const o = withMat(mat); o.geometry = geo; return o; },
    Mesh: function (geo, mat) { const o = withMat(mat); o.geometry = geo; return o; },
    Sprite: function (mat) { const o = withMat(mat); o.center = { set() { } }; return o; },
    Group: function () { return obj3(); },
    Scene: function () { return { add() { } }; },
    PerspectiveCamera: function (fov) { this.fov = fov; this.aspect = 1; this.position = new V3(0, 0, 30); this.updateProjectionMatrix = () => { }; },
    CanvasTexture: function () { this.minFilter = 0; this.needsUpdate = false; },
    TextureLoader: function () { this.load = () => { }; },
    CatmullRomCurve3: function (pts) { this.getPoints = (n) => Array.from({ length: n + 1 }, () => new V3()); this.getPoint = () => new V3(); },
    Raycaster: function () { this.setFromCamera = () => { }; this.intersectObjects = () => []; },
    Camera: function () { this.position = new V3(); },
    Clock: function () { this.getElapsedTime = () => 0.5; },
    WebGLRenderer: function () {
        this.autoClear = true;
        this.setPixelRatio = () => { }; this.getPixelRatio = () => 2; this.setSize = () => { };
        this.setClearColor = () => { }; this.setScissorTest = () => { }; this.setScissor = () => { };
        this.setViewport = () => { }; this.clear = () => { }; this.render = () => { };
    }
};

// ---- DOM / env stubs ----
const ctx2d = () => new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient') ? (() => ({ addColorStop() { } })) : (() => { }) });
const fakeCanvas = () => ({ width: 256, height: 256, clientWidth: 1440, clientHeight: 900, style: {}, className: '', setAttribute() { }, getContext: () => ctx2d(), parentElement: { clientWidth: 1440, clientHeight: 900, querySelector: () => null }, closest: () => ({ addEventListener() { } }), addEventListener() { }, getBoundingClientRect: () => ({ left: 0, top: 0, right: 1440, bottom: 900, width: 1440, height: 900 }) });
const fakeViz = () => ({ closest: () => ({ addEventListener() { } }), addEventListener() { }, getBoundingClientRect: () => ({ left: 20, top: 300, right: 320, bottom: 392, width: 300, height: 92 }) });

const REDUCE = process.env.FX_REDUCE === '1';
// bounded rAF: fire the loop a few times so the non-reduced-motion hot path
// (morph, flow, inference run) actually executes frame(), then stop.
let rafBudget = 4;
const raf = (cb) => { if (rafBudget-- > 0) cb(performance.now()); return 0; };
const VW = process.env.FX_SMALL === '1' ? 390 : 1440;
global.window = {
    innerWidth: VW, innerHeight: 844, devicePixelRatio: 2,
    matchMedia: (q) => ({ matches: REDUCE && /reduce/.test(q), addEventListener() { }, addListener() { } }),
    addEventListener() { }, removeEventListener() { },
    requestAnimationFrame: raf, cancelAnimationFrame() { },
    WebGLRenderingContext: function () { }, IntersectionObserver: function () { this.observe = () => { }; },
    THREE
};
global.requestAnimationFrame = raf;
global.cancelAnimationFrame = () => { };
global.IntersectionObserver = window.IntersectionObserver;
global.performance = { now: () => 1000 };
Object.defineProperty(global, 'navigator', { value: { hardwareConcurrency: 8, deviceMemory: 8, connection: { saveData: false }, languages: ['en'] }, configurable: true });
global.getComputedStyle = () => ({ getPropertyValue: () => '' });
global.Image = function () { this.onload = null; this.onerror = null; this.crossOrigin = ''; this.width = 96; this.height = 120; Object.defineProperty(this, 'src', { set() { } }); };
global.document = {
    documentElement: { classList: { contains: () => false }, getAttribute: () => 'on', dataset: { fx: 'on' }, setAttribute() { }, style: { setProperty() { } } },
    body: { appendChild() { } },
    createElement: () => fakeCanvas(),
    getElementById: () => fakeCanvas(),
    querySelector: (sel) => sel === '.journey-viz' ? fakeViz() : null,
    querySelectorAll: (sel) => sel === '.research-viz' ? [fakeViz(), fakeViz(), fakeViz(), fakeViz()] : [],
    addEventListener() { }
};

const { buildHeroScene } = await import('./scenes/hero.js');
const { buildCards } = await import('./scenes/cards.js');
try {
    const handle = buildHeroScene(fakeCanvas());   // setup + one frame via play()
    if (handle && handle.setScroll) {
        // scrub the scroll morph across its whole range, then force a frame
        [0, 0.3, 0.55, 0.8, 1].forEach((p) => handle.setScroll(p));
        handle.renderStatic();
        handle.setScroll(0);
    }
    const cards = buildCards();                     // shared scissor-test renderer
    if (cards && cards.renderStatic) cards.renderStatic();
    console.log('SMOKE PASS — hero (setup+morph+frame) and cards (setup+frame) ran with no errors');
} catch (e) {
    console.error('SMOKE FAIL:', e);
    process.exit(1);
}
