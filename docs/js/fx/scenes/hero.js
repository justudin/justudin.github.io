/* Hero — "Applied Intelligence: real-world flow"
   One continuous scene that fuses two ideas the site is about:

     REAL WORLD ──stream──▶ PERCEPTION ──▶ REASONING ──▶ DECISION
     (data globe)          (patchify photo) (attention)   (labels)

   A rotating point-cloud globe (the messy real world) sheds particles that
   stream into a Vision-Transformer pipeline: the profile photo is split into
   patches, embedded into a token sequence, contextualised by self-attention,
   read out by an MLP head into multi-label decisions. Hover accelerates the
   flow; a click (or tap) re-runs inference — a pulse sweeps the pipeline and
   the decision bars re-fill.

   House rules kept: one shared renderer, lazy three.js, pause off-screen and
   on tab-hide, re-skin on 'aint:theme', single static frame under reduced
   motion, full graceful fallback. */

import { SMALL, DPR, heroParticleBudget, REDUCED_MOTION, FINE_POINTER } from '../utils/env.js';
import { isDark, cssVar, onTheme } from '../utils/theme.js';
import { glowVert, glowFrag, globeVert, globeFrag } from '../shaders/hero-particles.js';

export function buildHeroScene(canvas) {
    const THREE = window.THREE;

    const renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: false, powerPreference: 'low-power'
    });
    renderer.setPixelRatio(DPR);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 0, 30);

    const group = new THREE.Group();
    scene.add(group);

    /* ===== pipeline layout (world units, flows left → right) ===== */
    const GLOBE_X = SMALL ? -8.5 : -19;
    const GLOBE_R = SMALL ? 5.4 : 7.4;
    const IMG_X = SMALL ? -3.4 : -7.5;
    const SEQ_X = SMALL ? 1.1 : 1.5;
    const MLP_X = SMALL ? 4.6 : 7.5;
    const OUT_X = SMALL ? 5.6 : 10.5;
    const GRID = SMALL ? 3 : 4;
    const NPATCH = GRID * GRID;
    const TILE = SMALL ? 1.15 : 1.5;
    const EXPLODE = SMALL ? 0.32 : 0.45;
    const TOKEN_GAP = SMALL ? 0.9 : 0.82;
    const MAXLEN = SMALL ? 2.0 : 3.4;
    const SCENE_Y = SMALL ? 3.4 : 1.2;

    group.position.y = SCENE_Y;

    /* ---------- shared glow-sprite material factory (pipeline points) ---------- */
    const glowMats = [];
    const makeGlow = (opacity) => {
        const m = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }, uWave: { value: -999 }, uBoost: { value: 0 },
                uPR: { value: renderer.getPixelRatio() },
                uColor: { value: new THREE.Color('#0047BB') },
                uColorB: { value: new THREE.Color('#0090FF') },
                uCore: { value: new THREE.Color('#FFFFFF') },
                uOpacity: { value: opacity }
            },
            vertexShader: glowVert, fragmentShader: glowFrag,
            transparent: true, depthWrite: false
        });
        glowMats.push(m);
        return m;
    };
    const buildGlowPoints = (positions, sizeMin, sizeMax, opacity, mix) => {
        const geo = new THREE.BufferGeometry();
        const n = positions.length / 3;
        const seeds = new Float32Array(n), sizes = new Float32Array(n), mixes = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            seeds[i] = Math.random();
            sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
            mixes[i] = mix ? mix[i] : 0;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('aMix', new THREE.BufferAttribute(mixes, 1));
        return new THREE.Points(geo, makeGlow(opacity));
    };

    /* =====================================================================
       REAL WORLD — the data globe (own morph + pointer-repulsion material)
       ===================================================================== */
    const N = heroParticleBudget();
    const gPos = new Float32Array(N * 3);
    const gScatter = new Float32Array(N * 3);
    const gPortrait = new Float32Array(N * 3);   // filled once the photo decodes
    const gSeed = new Float32Array(N), gSize = new Float32Array(N), gMix = new Float32Array(N);
    const surface = [];   // cached surface points the stream launches from
    const GA = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
        let x, y, z, onSurface = false;
        if (i % 7 === 0) {
            const r = GLOBE_R * 0.55 * Math.cbrt(Math.random());
            const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
            x = r * s * Math.cos(a); y = r * u; z = r * s * Math.sin(a);
        } else {
            const k = i + 0.5, fy = 1 - (k / N) * 2, rad = Math.sqrt(1 - fy * fy), th = GA * k;
            const r = GLOBE_R * (0.985 + Math.random() * 0.05);
            x = Math.cos(th) * rad * r; y = fy * r; z = Math.sin(th) * rad * r;
            onSurface = true;
        }
        gPos[i * 3] = x; gPos[i * 3 + 1] = y; gPos[i * 3 + 2] = z;
        const len = Math.hypot(x, y, z) || 1, sr = GLOBE_R * (2.0 + Math.random() * 2.6);
        gScatter[i * 3] = (x / len) * sr + (Math.random() - 0.5) * 6;
        gScatter[i * 3 + 1] = (y / len) * sr + (Math.random() - 0.5) * 6;
        gScatter[i * 3 + 2] = (z / len) * sr + (Math.random() - 0.5) * 6;
        // default portrait = globe, so the scroll morph is a harmless no-op until
        // the photo is sampled (and stays a no-op if the fetch/decode fails)
        gPortrait[i * 3] = x; gPortrait[i * 3 + 1] = y; gPortrait[i * 3 + 2] = z;
        gSeed[i] = Math.random();
        gSize[i] = 0.8 + Math.random() * 1.4;
        gMix[i] = Math.min(1, Math.abs(y) / GLOBE_R * 0.9 + Math.random() * 0.35);
        // launch particles from the globe's right hemisphere (facing the pipeline)
        if (onSurface && x > GLOBE_R * 0.1 && surface.length < 400) surface.push([x, y, z]);
    }
    const globeGeo = new THREE.BufferGeometry();
    globeGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    globeGeo.setAttribute('aScatter', new THREE.BufferAttribute(gScatter, 3));
    const portraitAttr = new THREE.BufferAttribute(gPortrait, 3);
    globeGeo.setAttribute('aPortrait', portraitAttr);
    globeGeo.setAttribute('aSeed', new THREE.BufferAttribute(gSeed, 1));
    globeGeo.setAttribute('aSize', new THREE.BufferAttribute(gSize, 1));
    globeGeo.setAttribute('aMix', new THREE.BufferAttribute(gMix, 1));
    const globeMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() },
            uIntro: { value: REDUCED_MOTION ? 0 : 1 },
            uSeg1: { value: 0 }, uSeg2: { value: 0 },
            uPointer: { value: new THREE.Vector3() }, uPointerHeat: { value: 0 },
            uColorA: { value: new THREE.Color('#0047BB') },
            uColorB: { value: new THREE.Color('#0090FF') },
            uCore: { value: new THREE.Color('#FFFFFF') }, uOpacity: { value: 0.9 }
        },
        vertexShader: globeVert, fragmentShader: globeFrag,
        transparent: true, depthWrite: false
    });
    const globe = new THREE.Points(globeGeo, globeMat);
    const globeGroup = new THREE.Group();       // own rotation, independent of pipeline sway
    globeGroup.position.x = GLOBE_X;
    globeGroup.add(globe);
    group.add(globeGroup);

    // faint great-circle rings girdling the globe (a "planet" read)
    const ringMats = [];
    for (let k = 0; k < 2; k++) {
        const seg = 120, arr = new Float32Array((seg + 1) * 3);
        for (let i = 0; i <= seg; i++) {
            const a = i / seg * Math.PI * 2;
            arr[i * 3] = Math.cos(a) * GLOBE_R * 1.02;
            arr[i * 3 + 1] = Math.sin(a) * GLOBE_R * 1.02;
            arr[i * 3 + 2] = 0;
        }
        const rg = new THREE.BufferGeometry();
        rg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const rm = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false });
        const ring = new THREE.Line(rg, rm);
        ring.rotation.x = k === 0 ? Math.PI / 2 : Math.PI / 2.6;
        ring.rotation.y = k * 0.6;
        globe.add(ring);
        ringMats.push(rm);
    }

    /* Sample a point-cloud portrait from the profile photo for the scroll
       morph: luminance-weighted, masked to a soft ellipse so only the central
       bust survives (background corners are dropped) — reads as a portrait
       silhouette regardless of the photo's backdrop. Runs once on decode;
       until then (or if it fails) aPortrait stays equal to the globe, making
       the morph a harmless no-op. */
    let portraitReady = false;
    const samplePortrait = (img) => {
        const w = 100, h = Math.max(1, Math.round(100 * img.height / img.width));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, w, h);
        let data;
        try { data = cx.getImageData(0, 0, w, h).data; } catch (e) { return; }
        const PH = 2 * GLOBE_R * 1.15, PW = PH * (w / h);
        const wgt = new Float32Array(w * h); let maxW = 0;
        for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
            const idx = (py * w + px) * 4;
            const l = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
            const nx = (px / w - 0.5) / 0.5, ny = (py / h - 0.5) / 0.5;
            const rr = nx * nx + ny * ny;
            const mask = Math.max(0, 1 - Math.max(0, rr - 0.5) / 0.6);
            const v = l * mask;
            wgt[py * w + px] = v; if (v > maxW) maxW = v;
        }
        if (maxW <= 0) return;
        for (let i = 0; i < N; i++) {
            let px = 0, py = 0, tries = 0;
            do { px = (Math.random() * w) | 0; py = (Math.random() * h) | 0; tries++; }
            while (wgt[py * w + px] < Math.random() * maxW && tries < 40);
            gPortrait[i * 3] = (px / w - 0.5) * PW;
            gPortrait[i * 3 + 1] = (0.5 - py / h) * PH;
            gPortrait[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
        }
        portraitAttr.needsUpdate = true;
        portraitReady = true;
    };
    if (!REDUCED_MOTION) {
        const pimg = new Image();
        pimg.crossOrigin = 'anonymous';
        pimg.onload = () => { try { samplePortrait(pimg); } catch (e) { console.error(e); } };
        pimg.src = 'img/profile_mobile.webp';
    }

    /* =====================================================================
       PERCEPTION — profile photo split into patches that explode apart
       ===================================================================== */
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = imgCanvas.height = 256;
    (() => {
        const c = imgCanvas.getContext('2d');
        const sky = c.createLinearGradient(0, 0, 0, 256);
        sky.addColorStop(0, '#0b1e4d'); sky.addColorStop(0.42, '#2059a6');
        sky.addColorStop(0.66, '#f0a35a'); sky.addColorStop(1, '#f7d78e');
        c.fillStyle = sky; c.fillRect(0, 0, 256, 256);
        c.fillStyle = '#fff2cf'; c.beginPath(); c.arc(184, 92, 15, 0, Math.PI * 2); c.fill();
    })();
    const imgTex = new THREE.CanvasTexture(imgCanvas);
    imgTex.minFilter = THREE.LinearFilter;

    const patches = [], patchEdgeMats = [], patchImg = [], patchHome = [];
    const gridC = (GRID - 1) / 2;
    for (let r = 0; r < GRID; r++) for (let col = 0; col < GRID; col++) {
        const geo = new THREE.PlaneGeometry(TILE * 0.94, TILE * 0.94);
        const u0 = col / GRID, u1 = (col + 1) / GRID, v0 = 1 - (r + 1) / GRID, v1 = 1 - r / GRID;
        const uv = geo.getAttribute('uv');
        uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
        uv.needsUpdate = true;
        const mat = new THREE.MeshBasicMaterial({ map: imgTex, transparent: true, opacity: 0.97 });
        const mesh = new THREE.Mesh(geo, mat);
        const cx = col - gridC, cy = gridC - r;
        patchImg.push(new THREE.Vector3(IMG_X + cx * TILE, cy * TILE, 0));
        patchHome.push(new THREE.Vector3(IMG_X + cx * (TILE + EXPLODE), cy * (TILE + EXPLODE), (Math.random() - 0.5) * 1.2));
        mesh.position.copy(patchImg[patchImg.length - 1]);
        const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
        patchEdgeMats.push(edgeMat);
        group.add(mesh); patches.push(mesh);
    }
    new THREE.TextureLoader().load('img/profile_mobile.webp', (photo) => {
        photo.minFilter = THREE.LinearFilter;
        patches.forEach((p) => { p.material.map = photo; p.material.needsUpdate = true; });
    }, undefined, () => { });

    /* =====================================================================
       REASONING — token sequence + self-attention + MLP head
       ===================================================================== */
    const TOK = NPATCH + 1;
    const tokenPos = [], tokenMix = [];
    const colTop = ((TOK - 1) / 2) * TOKEN_GAP;
    for (let i = 0; i < TOK; i++) { tokenPos.push(new THREE.Vector3(SEQ_X, colTop - i * TOKEN_GAP, 0)); tokenMix.push(i / (TOK - 1)); }
    const patchTokPos = [];
    tokenPos.forEach((v) => patchTokPos.push(v.x, v.y, v.z));
    const tokens = buildGlowPoints(patchTokPos, 1.6, 2.1, 0.95, tokenMix);
    group.add(tokens);
    const clsPoint = buildGlowPoints([tokenPos[0].x, tokenPos[0].y, tokenPos[0].z], 3.0, 3.0, 1.0);
    group.add(clsPoint);

    // encoder panels stacked behind the sequence (×N depth)
    const panels = [];
    const panelW = SMALL ? 3.0 : 3.8, panelH = colTop * 2 + (SMALL ? 1.6 : 2.2);
    for (let k = 0; k < 3; k++) {
        const pm = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false });
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(panelW - k * 0.3, panelH - k * 0.5), pm);
        panel.position.set(SEQ_X, 0, -1.1 - k * 1.3);
        group.add(panel); panels.push(panel);
    }

    // self-attention: line between every token pair
    const pairs = [];
    for (let i = 0; i < TOK; i++) for (let j = i + 1; j < TOK; j++) pairs.push([i, j]);
    const attnCol = new Float32Array(pairs.length * 6);
    const attnPos = new Float32Array(pairs.length * 6);
    pairs.forEach(([a, b], i) => {
        attnPos.set([tokenPos[a].x, tokenPos[a].y, tokenPos[a].z], i * 6);
        attnPos.set([tokenPos[b].x, tokenPos[b].y, tokenPos[b].z], i * 6 + 3);
    });
    const attnGeo = new THREE.BufferGeometry();
    attnGeo.setAttribute('position', new THREE.BufferAttribute(attnPos, 3));
    attnGeo.setAttribute('color', new THREE.BufferAttribute(attnCol, 3).setUsage(THREE.DynamicDrawUsage));
    const attnMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
    const attnLines = new THREE.LineSegments(attnGeo, attnMat);
    group.add(attnLines);

    // MLP head nodes + faint links from CLS
    const mlpPos = [], MLP_N = 3;
    for (let i = 0; i < MLP_N; i++) mlpPos.push(new THREE.Vector3(MLP_X, (i - (MLP_N - 1) / 2) * 1.9, 0));
    const mlpFlat = [];
    mlpPos.forEach((v) => mlpFlat.push(v.x, v.y, v.z));
    const mlpNodes = buildGlowPoints(mlpFlat, 2.0, 2.4, 0.95);
    group.add(mlpNodes);
    const mlpLinkPos = [];
    mlpPos.forEach((v) => mlpLinkPos.push(tokenPos[0].x, tokenPos[0].y, tokenPos[0].z, v.x, v.y, v.z));
    const mlpLinkGeo = new THREE.BufferGeometry();
    mlpLinkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mlpLinkPos), 3));
    const mlpLinkMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false });
    group.add(new THREE.LineSegments(mlpLinkGeo, mlpLinkMat));

    /* =====================================================================
       DECISION — multi-label probability bars
       ===================================================================== */
    const CLASSES = [
        { name: 'RESEARCHER', p: 0.98, on: true },
        { name: 'EDUCATOR', p: 0.94, on: true },
        { name: 'AI · DS', p: 0.91, on: true },
        { name: 'BIG DATA', p: 0.84, on: false },
        { name: 'ANALYTICS', p: 0.72, on: false }
    ];
    const nClass = SMALL ? 4 : CLASSES.length;
    const BAR_GAP = SMALL ? 1.35 : 1.55, BAR_H = SMALL ? 0.6 : 0.75;
    const bars = [], trackMats = [];
    for (let i = 0; i < nClass; i++) {
        const y = ((nClass - 1) / 2 - i) * BAR_GAP;
        const tGeo = new THREE.PlaneGeometry(1, BAR_H); tGeo.translate(0.5, 0, 0);
        const tMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false });
        const track = new THREE.Mesh(tGeo, tMat);
        track.position.set(OUT_X, y, -0.1); track.scale.x = MAXLEN;
        group.add(track); trackMats.push(tMat);
        const bGeo = new THREE.PlaneGeometry(1, BAR_H); bGeo.translate(0.5, 0, 0);
        const bMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false });
        const bar = new THREE.Mesh(bGeo, bMat);
        bar.position.set(OUT_X, y, 0);
        const len = MAXLEN * CLASSES[i].p;
        bar.scale.x = len;
        group.add(bar);
        bars.push({ mesh: bar, mat: bMat, y, len, on: CLASSES[i].on, tip: new THREE.Vector3(OUT_X + len, y, 0) });
    }
    const activeBars = bars.filter((b) => b.on);

    /* ---------- STREAM: globe surface → input image (curved trails) ---------- */
    const STREAM = SMALL ? 26 : 60;
    const streamState = [];
    const streamPos = new Float32Array(STREAM * 3);
    const mkStream = (i) => {
        const s = surface.length ? surface[(Math.random() * surface.length) | 0] : [GLOBE_R, 0, 0];
        streamState[i] = {
            from: new THREE.Vector3(GLOBE_X + s[0], s[1], s[2]),
            to: patchHome[(Math.random() * NPATCH) | 0],
            t: Math.random(), sp: 0.28 + Math.random() * 0.5,
            arc: (Math.random() - 0.5) * 5
        };
    };
    for (let i = 0; i < STREAM; i++) mkStream(i);
    const stream = buildGlowPoints(streamPos, 1.1, 1.6, 1.0);
    stream.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
    group.add(stream);

    /* ---------- readout particles: CLS → MLP → winning bar ---------- */
    const READ = SMALL ? 5 : 9;
    const readState = [], readPos = new Float32Array(READ * 3);
    for (let i = 0; i < READ; i++) readState.push({ t: Math.random(), sp: 0.35 + Math.random() * 0.4, node: i % MLP_N, bar: activeBars[i % activeBars.length] });
    const readParticles = buildGlowPoints(readPos, 1.1, 1.5, 1.0);
    readParticles.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
    group.add(readParticles);

    /* ---------- ambient dust ---------- */
    const dustPos = [];
    const DUST = SMALL ? 40 : 90;
    for (let i = 0; i < DUST; i++) dustPos.push((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 36, (Math.random() - 0.5) * 24 - 4);
    const dust = buildGlowPoints(dustPos, 0.35, 0.6, 0.22);
    scene.add(dust);

    /* ---------- HUD stage captions (desktop only) ---------- */
    const makeText = (text, opts) => {
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 80;
        const ctx = cv.getContext('2d');
        const tex = new THREE.CanvasTexture(cv);
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        spr.scale.set(opts.w, opts.w * (80 / 512), 1);
        spr.userData.draw = (color, alpha) => {
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.font = (opts.weight || 700) + ' ' + (opts.size || 27) + 'px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = color; ctx.globalAlpha = alpha == null ? 0.9 : alpha;
            ctx.fillText(opts.spaced ? text.split('').join(' ') : text, cv.width / 2, cv.height / 2);
            tex.needsUpdate = true;
        };
        return spr;
    };
    const stageLabels = SMALL ? [] : [
        { s: makeText('REAL WORLD', { w: 7, spaced: true }), w: 7, x: () => GLOBE_X },
        { s: makeText('PERCEPTION', { w: 7, spaced: true }), w: 7, x: () => IMG_X },
        { s: makeText('REASONING', { w: 7, spaced: true }), w: 7, x: () => (SEQ_X + MLP_X) / 2 },
        { s: makeText('DECISION', { w: 6, spaced: true }), w: 6, x: () => OUT_X + MAXLEN * 0.5 }
    ];
    stageLabels.forEach((l) => scene.add(l.s));

    const classTags = [];
    for (let i = 0; i < nClass; i++) {
        const t = makeText(CLASSES[i].name, { w: SMALL ? 4.4 : 5.6, size: 30 });
        t.userData.align = 'left';
        t.position.set(OUT_X + MAXLEN + (SMALL ? 1.4 : 3.2), bars[i].y, 0);
        group.add(t); classTags.push(t);
    }

    /* ---------- theme ---------- */
    const palette = { signal: new THREE.Color(), node: new THREE.Color(), hot: new THREE.Color(), line: new THREE.Color() };
    let ringBaseOp = 0.16;
    let globeBaseOp = 0.9;
    const applyTheme = () => {
        const dark = isDark();
        const node = new THREE.Color(cssVar('--scene-node', '#0047BB'));
        const line = new THREE.Color(cssVar('--scene-line', '#3F7AD6'));
        const signal = new THREE.Color(cssVar('--scene-signal', '#0090FF'));
        const dustC = new THREE.Color(cssVar('--scene-dust', '#9FBDEB'));
        const hot = new THREE.Color(cssVar('--scene-hot', '#00B894'));
        palette.signal.copy(signal); palette.node.copy(node); palette.hot.copy(hot); palette.line.copy(line);
        const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        const core = new THREE.Color(dark ? '#FFFFFF' : '#002B70');

        // globe
        globeMat.uniforms.uColorA.value = node;
        globeMat.uniforms.uColorB.value = signal;
        globeMat.uniforms.uCore.value = core.clone();
        globeBaseOp = dark ? 0.95 : 0.8;
        globeMat.uniforms.uOpacity.value = globeBaseOp;
        globeMat.blending = blend; globeMat.needsUpdate = true;
        ringBaseOp = dark ? 0.16 : 0.24;
        ringMats.forEach((m) => { m.color = line.clone(); m.blending = blend; });

        // pipeline points
        tokens.material.uniforms.uColor.value = signal;
        tokens.material.uniforms.uColorB.value = node;
        tokens.material.uniforms.uCore.value = core.clone();
        clsPoint.material.uniforms.uColor.value = hot;
        clsPoint.material.uniforms.uColorB.value = hot;
        clsPoint.material.uniforms.uCore.value = new THREE.Color('#FFFFFF');
        mlpNodes.material.uniforms.uColor.value = node;
        mlpNodes.material.uniforms.uColorB.value = signal;
        mlpNodes.material.uniforms.uCore.value = core.clone();
        stream.material.uniforms.uColor.value = signal;
        stream.material.uniforms.uColorB.value = hot;
        stream.material.uniforms.uCore.value = new THREE.Color('#FFFFFF');
        readParticles.material.uniforms.uColor.value = hot;
        readParticles.material.uniforms.uCore.value = new THREE.Color('#FFFFFF');
        dust.material.uniforms.uColor.value = dustC;
        dust.material.uniforms.uCore.value = dustC.clone();
        glowMats.forEach((m) => { m.blending = blend; m.needsUpdate = true; });
        attnMat.blending = blend;

        patchEdgeMats.forEach((m) => { m.color = line.clone(); m.opacity = dark ? 0.5 : 0.6; });
        panels.forEach((p) => { p.material.color = node.clone(); p.material.opacity = dark ? 0.07 : 0.05; });
        mlpLinkMat.color = line.clone(); mlpLinkMat.opacity = dark ? 0.16 : 0.2;
        bars.forEach((b) => b.mat.color = (b.on ? hot : line).clone());
        trackMats.forEach((m) => { m.color = line.clone(); m.opacity = dark ? 0.1 : 0.14; });

        const muted = cssVar('--muted', '#64748B');
        stageLabels.forEach((l) => l.s.userData.draw(muted));
        classTags.forEach((t, i) => {
            const on = bars[i] && bars[i].on;
            t.userData.draw(on ? '#' + hot.getHexString() : muted, on ? 1 : 0.6);
        });
    };
    applyTheme();

    /* ---------- sizing: fit content width into the frustum ---------- */
    const tanH = Math.tan((camera.fov * Math.PI / 180) / 2);
    const contentMinX = GLOBE_X - GLOBE_R;
    const contentMaxX = OUT_X + MAXLEN + (SMALL ? 0 : 7);
    const contentMidX = (contentMinX + contentMaxX) / 2;
    const contentW = contentMaxX - contentMinX;
    const resize = () => {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const frustumW = 2 * tanH * camera.aspect * camera.position.z;
        const fill = SMALL ? 0.98 : 0.92;
        const s = Math.min(1.1, (frustumW * fill) / contentW);
        group.scale.setScalar(s);
        group.position.x = -contentMidX * s;   // centre the composition horizontally
        const labelY = SCENE_Y * s + s * (colTop + (SMALL ? 1.0 : 1.4)) + 0.4;
        stageLabels.forEach((l) => {
            const lw = l.w * s;
            l.s.scale.set(lw, lw * (80 / 512), 1);
            l.s.position.set(group.position.x + l.x() * s, labelY, 0);
        });
    };
    resize();

    /* ---------- scroll morph: globe → portrait → dispersed stream ----------
       Driven by ScrollTrigger (utils/scroll.js) via the returned setScroll.
       As prog 0→1: the ViT pipeline fades, the globe recentres + grows and
       morphs into the photo portrait, then the portrait disperses and the
       globe fades out for a clean hand-off into the About section. */
    const staticFades = [];
    const regU = (m) => { const b = m.uniforms.uOpacity.value; staticFades.push((k) => m.uniforms.uOpacity.value = b * k); };
    const regO = (m) => { const b = m.opacity; staticFades.push((k) => m.opacity = b * k); };
    [tokens, clsPoint, mlpNodes, stream, readParticles].forEach((o) => regU(o.material));
    patches.forEach((p) => regO(p.material));
    patchEdgeMats.forEach(regO);
    trackMats.forEach(regO);
    regO(mlpLinkMat);
    classTags.forEach((t) => regO(t.material));
    stageLabels.forEach((l) => regO(l.s.material));

    let pipeOpacity = 1;    // dynamic mats (panels/bars/attn) multiply this in frame()
    let ringFade = 1;
    const setPipe = (k) => { pipeOpacity = k; staticFades.forEach((f) => f(k)); };

    const setScroll = (prog) => {
        const s1 = Math.max(0, Math.min(1, prog / 0.55));
        const s2 = Math.max(0, Math.min(1, (prog - 0.5) / 0.5));
        globeMat.uniforms.uSeg1.value = s1;
        globeMat.uniforms.uSeg2.value = s2;
        const s = group.scale.x || 1;
        const centerLocal = -group.position.x / s;    // local x that maps to screen centre
        globeGroup.position.x = GLOBE_X + (centerLocal - GLOBE_X) * s1;
        const gs = 1 + 0.4 * s1;
        globe.scale.set(gs, gs, gs);
        setPipe(1 - s1);
        ringFade = 1 - s1;
        globeMat.uniforms.uOpacity.value = globeBaseOp * (1 - s2 * 0.92);
    };

    /* ---------- pointer: parallax + globe repulsion ---------- */
    const ndc = new THREE.Vector2(), ndcTarget = new THREE.Vector2();
    let parallaxX = 0, parallaxY = 0, targetPX = 0, targetPY = 0, lastMove = 0;
    const onPointer = (e) => {
        ndcTarget.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
        targetPY = ndcTarget.x * 0.16;
        targetPX = ndcTarget.y * 0.08;
        lastMove = performance.now();
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });

    /* ---------- interaction: hover accelerates, click re-runs inference ---------- */
    let flow = 1, flowTarget = 1;       // global flow-speed multiplier
    let runBoost = 0, running = 0;       // inference-run pulse (0..1)
    const hero = canvas.closest('.hero') || canvas.parentElement;
    if (!REDUCED_MOTION && FINE_POINTER && hero) {
        hero.addEventListener('pointerenter', () => { flowTarget = 1.8; });
        hero.addEventListener('pointerleave', () => { flowTarget = 1; });
    }
    const triggerRun = () => { if (!REDUCED_MOTION) running = 1e-4; };   // arm the run
    if (hero) {
        hero.addEventListener('click', (e) => {
            // don't hijack clicks on real UI (nav, links, buttons, the scroll cue)
            if (e.target.closest('a, button, .lang-switch, .scroll-cue')) return;
            triggerRun();
        });
    }

    /* ---------- render loop ---------- */
    const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
    const clock = new THREE.Clock();
    let rafId = 0, visible = true, last = 0;

    const frame = () => {
        const t = clock.getElapsedTime();
        const dt = Math.min(Math.max(t - last, 0), 0.05); last = t;
        flow += (flowTarget - flow) * 0.06;

        // advance / decay an inference run
        if (running > 0) {
            running += dt / 1.6;
            runBoost = Math.sin(Math.min(running, 1) * Math.PI);   // 0→1→0
            if (running >= 1) { running = 0; runBoost = 0; }
        }

        // intro: globe condenses from scattered cloud
        if (!REDUCED_MOTION) globeMat.uniforms.uIntro.value = 1 - smooth((t - 0.15) / 1.9);

        // globe spins on its own axis; whole group gets pointer parallax
        globe.rotation.y += dt * 0.12 * flow;
        globe.rotation.x = Math.sin(t * 0.12) * 0.12;
        parallaxY += (targetPY - parallaxY) * 0.05;
        parallaxX += (targetPX - parallaxX) * 0.05;
        group.rotation.y = Math.sin(t * 0.08) * 0.03 + parallaxY;
        group.rotation.x = Math.sin(t * 0.1) * 0.03 + parallaxX;
        dust.rotation.y = t * 0.01;

        // globe pointer repulsion (view-space pointer on z≈globe plane)
        const active = performance.now() - lastMove < 2000 ? 1 : 0;
        const heat = globeMat.uniforms.uPointerHeat;
        heat.value += (active - heat.value) * 0.06;
        ndc.lerp(ndcTarget, 0.12);
        const zd = camera.position.z;
        globeMat.uniforms.uPointer.value.set(ndc.x * tanH * camera.aspect * zd, ndc.y * tanH * zd, -zd);
        globeMat.uniforms.uTime.value = t;
        ringMats.forEach((m, k) => m.opacity = ringBaseOp * (0.7 + 0.3 * Math.sin(t * 0.9 + k)) * ringFade);

        // patches assemble → explode
        const ex = REDUCED_MOTION ? 1 : smooth((t - 0.6) / 1.8);
        const scan = (t * 3.0 * flow) % (NPATCH + 4);
        for (let i = 0; i < NPATCH; i++) {
            patches[i].position.lerpVectors(patchImg[i], patchHome[i], ex);
            const d = Math.abs(i - scan);
            patches[i].material.color.setScalar(1 + (1.1 * Math.max(0, 1 - d / 1.3) + runBoost * 0.6) * ex);
        }

        // pipeline pulse wave (sweeps faster + brighter during a run)
        const head = contentMinX + ((t * 12 * flow + runBoost * 30) % (contentW + 8));
        glowMats.forEach((m) => { m.uniforms.uTime.value = t; m.uniforms.uWave.value = head; m.uniforms.uBoost.value = runBoost; });
        panels.forEach((p, k) => p.material.opacity = (0.05 + 0.03 * (0.5 + 0.5 * Math.sin(t * 1.2 - k)) + runBoost * 0.05) * pipeOpacity);

        // STREAM: globe → input patches, along an arced path
        const sAttr = stream.geometry.getAttribute('position');
        for (let i = 0; i < STREAM; i++) {
            const st = streamState[i];
            st.t += st.sp * flow * dt * (1 + runBoost);
            if (st.t >= 1) { mkStream(i); st.t = 0; }
            const e = smooth(st.t);
            tmpA.copy(st.from); tmpB.copy(st.to);
            sAttr.array[i * 3] = tmpA.x + (tmpB.x - tmpA.x) * e;
            sAttr.array[i * 3 + 1] = tmpA.y + (tmpB.y - tmpA.y) * e + Math.sin(Math.PI * st.t) * st.arc;
            sAttr.array[i * 3 + 2] = tmpA.z + (tmpB.z - tmpA.z) * e + Math.sin(Math.PI * st.t) * 2.0;
        }
        sAttr.needsUpdate = true;

        // self-attention: query token sweeps the sequence; CLS links stay warm
        const q = (t * 1.6 * flow) % TOK;
        for (let i = 0; i < pairs.length; i++) {
            const [a, b] = pairs[i];
            const near = Math.max(1 - Math.abs(a - q), 1 - Math.abs(b - q));
            const toCls = (a === 0 || b === 0) ? 0.5 : 0;
            const inten = Math.max(0.08, Math.max(near, toCls)) * (1 + runBoost * 0.8);
            const c = (a === 0 || b === 0) ? palette.hot : palette.signal;
            const o = i * 6;
            attnCol[o] = c.r * inten; attnCol[o + 1] = c.g * inten; attnCol[o + 2] = c.b * inten;
            attnCol[o + 3] = attnCol[o]; attnCol[o + 4] = attnCol[o + 1]; attnCol[o + 5] = attnCol[o + 2];
        }
        attnGeo.getAttribute('color').needsUpdate = true;
        attnMat.opacity = (0.35 + 0.25 * ex) * (1 + runBoost * 0.3) * pipeOpacity;

        // readout particles: CLS → MLP → winning bar tip
        const rAttr = readParticles.geometry.getAttribute('position');
        for (let i = 0; i < READ; i++) {
            const st = readState[i];
            st.t += st.sp * flow * dt * (1 + runBoost);
            if (st.t >= 1) { st.t = 0; st.node = (Math.random() * MLP_N) | 0; st.bar = activeBars[(Math.random() * activeBars.length) | 0]; }
            let e2;
            if (st.t < 0.5) { tmpA.copy(tokenPos[0]); tmpB.copy(mlpPos[st.node]); e2 = smooth(st.t / 0.5); }
            else { tmpA.copy(mlpPos[st.node]); tmpB.copy(st.bar.tip); e2 = smooth((st.t - 0.5) / 0.5); }
            rAttr.array[i * 3] = tmpA.x + (tmpB.x - tmpA.x) * e2;
            rAttr.array[i * 3 + 1] = tmpA.y + (tmpB.y - tmpA.y) * e2;
            rAttr.array[i * 3 + 2] = tmpA.z + (tmpB.z - tmpA.z) * e2 + Math.sin(Math.PI * (st.t % 0.5) * 2) * 1.0;
        }
        rAttr.needsUpdate = true;

        // decision bars: during a run they re-fill from 0, else gently pulse
        bars.forEach((b, i) => {
            const fill = running > 0 ? smooth(Math.min(running * 1.4 - i * 0.06, 1)) : 1;
            if (b.on) { b.mat.opacity = (0.85 + 0.15 * Math.sin(t * 3.2 + i * 0.6)) * pipeOpacity; b.mesh.scale.x = b.len * fill * (0.985 + 0.015 * Math.sin(t * 3.2 + i)); }
            else { b.mat.opacity = 0.6 * pipeOpacity; b.mesh.scale.x = b.len * fill * (0.9 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.7 + i))); }
        });

        renderer.render(scene, camera);
    };

    const loop = () => { frame(); rafId = requestAnimationFrame(loop); };
    const play = () => {
        cancelAnimationFrame(rafId);
        if (REDUCED_MOTION) { frame(); return; }
        if (visible && !document.hidden) rafId = requestAnimationFrame(loop);
    };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((e) => { visible = e[0].isIntersecting; play(); }, { threshold: 0.02 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', play);
    window.addEventListener('resize', () => { resize(); if (REDUCED_MOTION) frame(); });
    onTheme(() => { applyTheme(); if (REDUCED_MOTION) frame(); });

    play();

    // handle for the scroll layer (utils/scroll.js). renderStatic lets the
    // scroll driver force a frame after setScroll while the loop is paused
    // (e.g. reduced motion, or the hero briefly off the raf schedule).
    return { setScroll, renderStatic: frame };
}
