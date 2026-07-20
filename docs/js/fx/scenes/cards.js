/* Research pillar cards — four micro-visualizations rendered by ONE shared
   WebGLRenderer via the scissor test (not four renderers). A single overlay
   canvas is fixed over the viewport (pointer-events: none, so card hover/tilt
   still work); each frame we walk the visible `.research-viz` placeholders,
   set the renderer's viewport + scissor to each one's screen rect, and draw
   that card's mini-scene into it.

     R/01 Industrial AI        — gear-like torus-knot particle ring
     R/02 Data Intelligence    — flowing curl-noise particle stream
     R/03 Industrial Analytics — 3D line chart with an anomaly pulse
     R/04 Industrial Informatics — connected node mesh with pulsing edges

   Hover a card → its scene speeds up and glows. The whole manager pauses when
   the Research section is off-screen or the tab is hidden, and re-skins on
   'aint:theme'. Placeholders only exist when the FX gate is on, so non-FX
   visitors keep the original SVG icons untouched. */

import { DPR, REDUCED_MOTION } from '../utils/env.js';
import { isDark, cssVar, onTheme } from '../utils/theme.js';
import { buildBrandAtom, buildAboutCycle } from './embeds.js';
import { noiseVert, noiseFrag } from '../shaders/noise-wipe.js';

export function buildCards() {
    const THREE = window.THREE;
    const els = Array.from(document.querySelectorAll('.research-viz'));
    if (!els.length) return null;

    const canvas = document.createElement('canvas');
    canvas.className = 'fx-cards-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;

    /* soft radial sprite shared by every particle scene */
    const dotTex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
    })();

    const pointsMat = (size, opacity) => {
        const m = new THREE.PointsMaterial({
            map: dotTex, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true
        });
        m.userData.base = opacity;
        return m;
    };

    /* ---------------- scene builders (one per card type) ---------------- */
    const makeBase = (el) => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 6);
        const group = new THREE.Group();
        scene.add(group);
        return { el, scene, camera, group, hover: 0, hoverT: 0, mats: [], lineMats: [] };
    };

    // R/01 — torus-knot particle ring
    const buildKnot = (el) => {
        const s = makeBase(el);
        const NP = 360, p = 2, q = 3, R = 1.7, arr = new Float32Array(NP * 3);
        for (let i = 0; i < NP; i++) {
            const u = i / NP * Math.PI * 2;
            const cu = Math.cos(q * u), r = R * (0.6 + 0.25 * cu);
            arr[i * 3] = r * Math.cos(p * u);
            arr[i * 3 + 1] = r * Math.sin(p * u);
            arr[i * 3 + 2] = R * 0.4 * Math.sin(q * u);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const mat = pointsMat(0.16, 0.9); s.mats.push(mat);
        s.group.add(new THREE.Points(geo, mat));
        s.update = (t, sp) => { s.group.rotation.z = t * 0.4 * sp; s.group.rotation.x = 0.5 + Math.sin(t * 0.5) * 0.2; s.group.rotation.y = t * 0.6 * sp; };
        return s;
    };

    // R/02 — flowing curl-noise-ish particle stream
    const buildStream = (el) => {
        const s = makeBase(el);
        const NP = 260, arr = new Float32Array(NP * 3), st = [];
        const spawn = (i) => { arr[i * 3] = -2.6 + Math.random() * 0.5; arr[i * 3 + 1] = (Math.random() - 0.5) * 3; arr[i * 3 + 2] = (Math.random() - 0.5) * 1.5; st[i] = 0.4 + Math.random() * 0.7; };
        for (let i = 0; i < NP; i++) spawn(i);
        const geo = new THREE.BufferGeometry();
        const attr = new THREE.BufferAttribute(arr, 3).setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', attr);
        const mat = pointsMat(0.13, 0.85); s.mats.push(mat);
        s.group.add(new THREE.Points(geo, mat));
        s.update = (t, sp) => {
            for (let i = 0; i < NP; i++) {
                const x = arr[i * 3], y = arr[i * 3 + 1];
                // divergence-free-ish field: velocity from a stream function's curl
                const vx = 0.8 + 0.5 * Math.sin(y * 1.3 + t * 0.7);
                const vy = 0.6 * Math.sin(x * 1.1 - t * 0.9);
                arr[i * 3] += vx * 0.016 * sp * st[i] * 2.2;
                arr[i * 3 + 1] += vy * 0.016 * sp * st[i] * 2.2;
                if (arr[i * 3] > 2.7) spawn(i);
            }
            attr.needsUpdate = true;
            s.group.rotation.y = Math.sin(t * 0.2) * 0.15;
        };
        return s;
    };

    // R/03 — 3D line chart with an anomaly pulse
    const buildChart = (el) => {
        const s = makeBase(el);
        const NP = 48, base = [];
        for (let i = 0; i < NP; i++) base.push(0.6 * Math.sin(i * 0.5) + 0.3 * Math.sin(i * 0.17));
        const arr = new Float32Array(NP * 3);
        const geo = new THREE.BufferGeometry();
        const attr = new THREE.BufferAttribute(arr, 3).setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', attr);
        const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }); s.lineMats.push(lineMat);
        s.group.add(new THREE.Line(geo, lineMat));
        // anomaly marker
        const markGeo = new THREE.BufferGeometry();
        markGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
        const markMat = pointsMat(0.5, 1); s.mats.push(markMat);
        const mark = new THREE.Points(markGeo, markMat);
        s.group.add(mark);
        s.group.rotation.x = 0.35;
        s.update = (t, sp) => {
            const anomI = ((Math.sin(t * 0.5) * 0.5 + 0.5) * (NP - 1)) | 0;
            for (let i = 0; i < NP; i++) {
                const spike = i === anomI ? 1.1 * (0.6 + 0.4 * Math.sin(t * 6)) : 0;
                arr[i * 3] = (i / (NP - 1) - 0.5) * 4.4;
                arr[i * 3 + 1] = base[i] + Math.sin(t * 1.5 * sp + i * 0.3) * 0.12 + spike;
                arr[i * 3 + 2] = Math.sin(i * 0.4 + t * 0.3) * 0.3;
            }
            attr.needsUpdate = true;
            markGeo.getAttribute('position').array.set([arr[anomI * 3], arr[anomI * 3 + 1], arr[anomI * 3 + 2]]);
            markGeo.getAttribute('position').needsUpdate = true;
            markMat.size = 0.42 + 0.18 * Math.sin(t * 6);
            s.group.rotation.y = Math.sin(t * 0.35 * sp) * 0.35;
        };
        return s;
    };

    // R/04 — connected node mesh with pulsing edges
    const buildMesh = (el) => {
        const s = makeBase(el);
        const NN = 14, nodes = [];
        for (let i = 0; i < NN; i++) nodes.push(new THREE.Vector3((Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 3.0, (Math.random() - 0.5) * 2.2));
        const nArr = new Float32Array(NN * 3);
        nodes.forEach((v, i) => { nArr[i * 3] = v.x; nArr[i * 3 + 1] = v.y; nArr[i * 3 + 2] = v.z; });
        const nGeo = new THREE.BufferGeometry();
        nGeo.setAttribute('position', new THREE.BufferAttribute(nArr, 3));
        const nMat = pointsMat(0.2, 0.95); s.mats.push(nMat);
        s.group.add(new THREE.Points(nGeo, nMat));
        // edges to 2 nearest neighbours
        const seen = new Set(), ePos = [], edges = [];
        nodes.forEach((a, i) => {
            nodes.map((b, j) => ({ j, d: i === j ? 1e9 : a.distanceToSquared(b) })).sort((p, q) => p.d - q.d).slice(0, 2)
                .forEach(({ j }) => { const k = Math.min(i, j) + ':' + Math.max(i, j); if (seen.has(k)) return; seen.add(k); edges.push([i, j]); ePos.push(a.x, a.y, a.z, nodes[j].x, nodes[j].y, nodes[j].z); });
        });
        const eGeo = new THREE.BufferGeometry();
        eGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ePos), 3));
        const eMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4, depthWrite: false }); s.lineMats.push(eMat);
        s.group.add(new THREE.LineSegments(eGeo, eMat));
        s.update = (t, sp) => {
            s.group.rotation.y = t * 0.25 * sp;
            s.group.rotation.x = Math.sin(t * 0.3) * 0.25;
            eMat.opacity = 0.28 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2.4 * sp));
            nMat.size = 0.18 + 0.05 * Math.sin(t * 3);
        };
        return s;
    };

    // Journey — a glowing comet travels a CatmullRomCurve3 spine threading the
    // milestone nodes; the last node (2026) shimmers "on the way". Comet
    // position tracks how far the Journey section has scrolled through view.
    const buildJourney = (el) => {
        const s = makeBase(el); s.kind = 'journey';
        s.camera.fov = 40; s.camera.position.set(0, 0, 8);
        const YS = 3.1, NNODE = 6, pts = [];
        for (let i = 0; i < NNODE; i++) pts.push(new THREE.Vector3(Math.sin(i * 1.3) * 0.14, YS - (i / (NNODE - 1)) * 2 * YS, 0));
        const curve = new THREE.CatmullRomCurve3(pts);
        const lGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(120));
        const lMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4, depthWrite: false }); s.lineMats.push(lMat);
        s.group.add(new THREE.Line(lGeo, lMat));
        const nArr = new Float32Array(NNODE * 3);
        pts.forEach((v, i) => { nArr[i * 3] = v.x; nArr[i * 3 + 1] = v.y; });
        const nGeo = new THREE.BufferGeometry(); nGeo.setAttribute('position', new THREE.BufferAttribute(nArr, 3));
        const nMat = pointsMat(0.24, 0.9); s.mats.push(nMat);
        s.group.add(new THREE.Points(nGeo, nMat));
        const lastGeo = new THREE.BufferGeometry();
        lastGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([pts[NNODE - 1].x, pts[NNODE - 1].y, 0]), 3));
        const lastMat = pointsMat(0.4, 1); s.mats.push(lastMat); s.lastMat = lastMat;
        s.group.add(new THREE.Points(lastGeo, lastMat));
        const TRAIL = 10, cArr = new Float32Array(TRAIL * 3);
        const cGeo = new THREE.BufferGeometry();
        const cAttr = new THREE.BufferAttribute(cArr, 3).setUsage(THREE.DynamicDrawUsage);
        cGeo.setAttribute('position', cAttr);
        const cMat = pointsMat(0.34, 1); s.mats.push(cMat); s.cometMat = cMat;
        s.group.add(new THREE.Points(cGeo, cMat));
        s.update = (t, sp) => {
            const r = el.getBoundingClientRect(), vh = window.innerHeight;
            let p = (vh * 0.5 - r.top) / (r.height || 1); p = Math.max(0, Math.min(1, p));
            for (let k = 0; k < TRAIL; k++) {
                const pt = curve.getPoint(Math.max(0, p - k * 0.02));
                cArr[k * 3] = pt.x; cArr[k * 3 + 1] = pt.y; cArr[k * 3 + 2] = 0.05;
            }
            cAttr.needsUpdate = true;
            cMat.size = 0.3 + 0.06 * Math.sin(t * 6);
            lastMat.size = 0.34 + 0.12 * (0.5 + 0.5 * Math.sin(t * 3));       // 2026 shimmer
            lastMat.opacity = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 3));
        };
        return s;
    };

    const builders = [buildKnot, buildStream, buildChart, buildMesh];
    const scenes = els.map((el, i) => builders[i % builders.length](el));
    const jEl = document.querySelector('.journey-viz');
    if (jEl) scenes.push(buildJourney(jEl));

    // Fold the About-cycle + nav brand-atom into this same shared renderer, so
    // the FX page runs on two WebGL contexts (hero + this) instead of five.
    // academic-page.js skips its own standalone versions when the gate is on.
    const aboutEl = document.getElementById('about-canvas');
    const brandEl = document.getElementById('brand-canvas');
    try { if (aboutEl) scenes.push(buildAboutCycle(aboutEl, THREE, dotTex)); } catch (e) { console.error('about embed:', e); }
    try { if (brandEl) scenes.push(buildBrandAtom(brandEl, THREE, dotTex)); } catch (e) { console.error('brand embed:', e); }

    /* full-viewport noise "wipe": a faint filmic grain everywhere, plus a band
       that sweeps a section as it scrolls into view (see shaders/noise-wipe). */
    const noiseUniforms = {
        uTime: { value: 0 }, uWipe: { value: 1 }, uOpacity: { value: 0.05 },
        uColor: { value: new THREE.Color('#ffffff') }, uAspect: { value: 1 }
    };
    const noiseMat = new THREE.ShaderMaterial({
        uniforms: noiseUniforms, vertexShader: noiseVert, fragmentShader: noiseFrag,
        transparent: true, depthWrite: false, depthTest: false
    });
    const noiseScene = new THREE.Scene();
    noiseScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), noiseMat));
    const noiseCam = new THREE.Camera();
    let wipe = 1, lastT = 0;

    /* ---- hover: speed up + glow the hovered card's scene ---- */
    if (!REDUCED_MOTION) scenes.forEach((sc) => {
        const card = sc.el.closest('.research-item') || sc.el;
        card.addEventListener('pointerenter', () => { sc.hover = 1; });
        card.addEventListener('pointerleave', () => { sc.hover = 0; });
    });

    /* ---- theme ---- */
    const applyTheme = () => {
        const dark = isDark();
        const node = new THREE.Color(cssVar('--scene-node', '#0047BB'));
        const signal = new THREE.Color(cssVar('--scene-signal', '#0090FF'));
        const hot = new THREE.Color(cssVar('--scene-hot', '#00B894'));
        const line = new THREE.Color(cssVar('--scene-line', '#3F7AD6'));
        const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        noiseUniforms.uColor.value = new THREE.Color(dark ? '#ffffff' : '#20408a');
        noiseUniforms.uOpacity.value = dark ? 0.06 : 0.045;
        const paint = [node, signal, hot, node];   // one accent per card
        scenes.forEach((sc, i) => {
            if (sc.kind === 'about' || sc.kind === 'brand') { if (sc.applyThemeSelf) sc.applyThemeSelf(); return; }
            if (sc.kind === 'journey') {
                sc.lineMats.forEach((m) => { m.color = line.clone(); m.blending = blend; });
                sc.mats.forEach((m) => {
                    const c = (m === sc.cometMat || m === sc.lastMat) ? hot : node;
                    m.color = c.clone(); m.blending = blend; m.needsUpdate = true;
                });
                return;
            }
            sc.mats.forEach((m) => { m.color = paint[i % paint.length].clone(); m.blending = blend; m.needsUpdate = true; });
            sc.lineMats.forEach((m) => { m.color = (i === 2 ? signal : line).clone(); m.blending = blend; });
        });
    };
    applyTheme();

    const resize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        renderer.setSize(w, h, false);
    };
    resize();

    const clock = new THREE.Clock();
    let rafId = 0, visible = true;

    const frame = () => {
        const t = clock.getElapsedTime();
        const dt = Math.min(Math.max(t - lastT, 0), 0.05); lastT = t;
        const vh = window.innerHeight, vw = window.innerWidth;
        renderer.setScissorTest(false);
        renderer.clear(true, true, true);
        // faint filmic grain + section wipe, full-viewport, behind the card views
        if (wipe < 1) wipe = Math.min(1, wipe + dt / 0.8);
        noiseUniforms.uTime.value = t;
        noiseUniforms.uWipe.value = wipe;
        noiseUniforms.uAspect.value = vw / (vh || 1);
        renderer.setViewport(0, 0, vw, vh);
        renderer.render(noiseScene, noiseCam);
        renderer.setScissorTest(true);
        for (const sc of scenes) {
            const r = sc.el.getBoundingClientRect();
            if (r.width === 0 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
            sc.hoverT += ((sc.hover ? 1 : 0) - sc.hoverT) * 0.08;
            const sp = 1 + sc.hoverT * 1.6;
            const bottom = vh - r.bottom;
            renderer.setViewport(r.left, bottom, r.width, r.height);
            renderer.setScissor(r.left, bottom, r.width, r.height);
            sc.camera.aspect = r.width / r.height;
            sc.camera.updateProjectionMatrix();
            sc.update(t, sp);
            // hover glow for the research cards only (kind-less). The kind'd
            // scenes (journey / about / brand) animate their own opacities in
            // update(), so leave those alone.
            if (!sc.kind) {
                if (sc.hoverT > 0.001) sc.mats.forEach((m) => { const b = m.userData.base != null ? m.userData.base : m.opacity; m.opacity = Math.min(1, b * (1 + sc.hoverT * 0.35)); });
                else sc.mats.forEach((m) => { if (m.userData.base != null) m.opacity = m.userData.base; });
            }
            renderer.render(sc.scene, sc.camera);
        }
    };

    const loop = () => { frame(); rafId = requestAnimationFrame(loop); };
    const play = () => {
        cancelAnimationFrame(rafId);
        if (REDUCED_MOTION) { frame(); return; }
        if (visible && !document.hidden) rafId = requestAnimationFrame(loop);
    };

    // stay active while ANY container that owns a view (hero for the brand atom,
    // or a section for the cards / journey / about) is on-screen; also fire a
    // noise wipe each time a new one scrolls in.
    const sections = [...new Set(scenes.map((sc) => sc.el.closest('.section, .hero')).filter(Boolean))];
    if (sections.length && 'IntersectionObserver' in window) {
        const shown = new Set();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) { if (!shown.has(en.target)) wipe = 0; shown.add(en.target); }
                else shown.delete(en.target);
            });
            visible = shown.size > 0;
            play();
        }, { threshold: 0.01 });
        sections.forEach((sec) => io.observe(sec));
    }
    document.addEventListener('visibilitychange', play);
    window.addEventListener('resize', () => { resize(); if (REDUCED_MOTION) frame(); });
    onTheme(() => { applyTheme(); if (REDUCED_MOTION) frame(); });

    play();
    return { renderStatic: frame };
}
