/* About-cycle + nav brand-atom, ported into the shared scissor-test renderer.
   When the FX gate is on, academic-page.js skips its own standalone renderers
   for these two and the shared manager (cards.js) draws them as extra scissor
   views — so the whole FX page runs on just two WebGL contexts (hero + shared)
   instead of five.

   Each builder returns the manager's scene descriptor shape:
     { el, scene, camera, group, kind, mats, lineMats,
       update(t, sp), applyThemeSelf() }
   plus its own pointer handlers (attached to the underlying canvas element,
   which still receives events because the overlay canvas is pointer-events:none).

   The visuals mirror the original academic-page scenes so the two paths look
   identical; only the plumbing (renderer, raf, resize, theme event) moves to
   the manager. */

import { REDUCED_MOTION } from '../utils/env.js';
import { isDark, cssVar } from '../utils/theme.js';

const root = document.documentElement;
const colorOf = (name, fb) => new (window.THREE.Color)(cssVar(name, fb));

/* "MS" monogram + ring drawn to a canvas texture, shared by both embeds
   (identical to academic-page's drawMSMonogram so the mark reads the same). */
const drawMonogram = (ctx, size, letterCol, ringCol) => {
    const C = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = ringCol;
    ctx.beginPath(); ctx.arc(C, C, size * 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = letterCol;
    ctx.font = `800 ${size * 0.46}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('MS', C, C + size * 0.035);
};

/* ========================= nav brand atom ========================= */
export function buildBrandAtom(el, THREE, dotTex) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 6);
    const s = { el, scene, camera, kind: 'brand', mats: [], lineMats: [], hover: 0, hoverT: 0 };

    const NUC = 256;
    const nucCanvas = document.createElement('canvas'); nucCanvas.width = nucCanvas.height = NUC;
    const nucCtx = nucCanvas.getContext('2d');
    const nucTex = new THREE.CanvasTexture(nucCanvas);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, depthTest: false }));
    halo.scale.set(3.2, 3.2, 1); scene.add(halo);
    const nucleus = new THREE.Sprite(new THREE.SpriteMaterial({ map: nucTex, transparent: true, depthWrite: false, depthTest: false }));
    nucleus.scale.set(2.05, 2.05, 1); scene.add(nucleus);

    const orbit = new THREE.Group(); scene.add(orbit);
    const R = 1.32, RY = R * 0.42, SEG = 90, NRINGS = 3;
    const rings = [];
    const spd = [1.15, -0.9, 1.4], phase = [0, 2.1, 4.2];
    for (let r = 0; r < NRINGS; r++) {
        const g = new THREE.Group(); g.rotation.z = r * (Math.PI / NRINGS); orbit.add(g);
        const arr = new Float32Array((SEG + 1) * 3);
        for (let i = 0; i <= SEG; i++) { const a = i / SEG * Math.PI * 2; arr[i * 3] = Math.cos(a) * R; arr[i * 3 + 1] = Math.sin(a) * RY; }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
        g.add(new THREE.Line(geo, mat));
        const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, depthTest: false }));
        e.scale.set(0.5, 0.5, 1); g.add(e);
        rings.push({ mat, electron: e, sp: spd[r], ph: phase[r] });
    }

    s.applyThemeSelf = () => {
        const dark = isDark();
        const line = colorOf('--scene-line', '#3F7AD6'), hot = colorOf('--scene-hot', '#00B894'), signal = colorOf('--scene-signal', '#0090FF');
        drawMonogram(nucCtx, NUC, cssVar('--accent', '#0047BB'), cssVar('--scene-line', '#3F7AD6')); nucTex.needsUpdate = true;
        const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        rings.forEach((r) => { r.mat.color = line.clone(); r.mat.opacity = dark ? 0.5 : 0.62; r.electron.material.color = hot.clone(); r.electron.material.blending = blend; });
        halo.material.color = signal.clone(); halo.material.opacity = dark ? 0.22 : 0.1; halo.material.blending = blend;
    };
    s.applyThemeSelf();

    let spin = 1, spinTarget = 1;
    const anchor = el.closest('.hero-brand') || el.parentElement;
    if (!REDUCED_MOTION && anchor) {
        anchor.addEventListener('pointerenter', () => { spinTarget = 2.7; });
        anchor.addEventListener('pointerleave', () => { spinTarget = 1; });
    }
    const tmp = new THREE.Vector3();
    s.update = (t) => {
        spin += (spinTarget - spin) * 0.08;
        orbit.rotation.z = t * 0.22 * spin;
        orbit.rotation.x = 0.34 + Math.sin(t * 0.6) * 0.1;
        orbit.rotation.y = Math.sin(t * 0.42) * 0.12;
        const hot = spin > 1.4;
        rings.forEach((r) => {
            const a = r.ph + t * r.sp * spin;
            r.electron.position.set(Math.cos(a) * R, Math.sin(a) * RY, 0);
            r.electron.getWorldPosition(tmp);
            const front = tmp.z > 0;
            r.electron.material.opacity = front ? 1 : 0.35;
            const sc = front ? 0.58 : 0.42; r.electron.scale.set(sc, sc, 1);
            r.mat.opacity = (isDark() ? 0.5 : 0.62) * (hot ? 1.35 : 1);
        });
        const pulse = 1 + 0.03 * Math.sin(t * 2.4);
        nucleus.scale.set(2.05 * pulse, 2.05 * pulse, 1);
        halo.material.opacity = (isDark() ? 0.22 : 0.1) * (0.75 + 0.4 * Math.sin(t * 2.4)) * (hot ? 1.6 : 1);
    };

    // WebGL is live — drop the static "M·S" fallback
    const fb = el.parentElement && el.parentElement.querySelector('.brand-fallback');
    if (fb) fb.style.display = 'none';
    return s;
}

/* ===================== About "Teach·Learn·Research·Collaborate" ===================== */
export function buildAboutCycle(el, THREE, dotTex) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 15);
    const s = { el, scene, camera, kind: 'about', mats: [], lineMats: [], hover: 0, hoverT: 0 };

    const WORDS = ['Teach', 'Learn', 'Research', 'Collaborate'];
    const N = WORDS.length, R = 3.5, TILT = 0.72;
    const group = new THREE.Group(); group.rotation.x = -TILT; scene.add(group);
    s.group = group;

    const SEG = 100, ringArr = new Float32Array((SEG + 1) * 3);
    for (let i = 0; i <= SEG; i++) { const a = i / SEG * Math.PI * 2; ringArr[i * 3] = Math.cos(a) * R; ringArr[i * 3 + 2] = Math.sin(a) * R; }
    const ringGeo = new THREE.BufferGeometry(); ringGeo.setAttribute('position', new THREE.BufferAttribute(ringArr, 3));
    const ringMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false });
    group.add(new THREE.Line(ringGeo, ringMat));

    const makeLabel = (text) => {
        const cv = document.createElement('canvas'); cv.width = 320; cv.height = 80;
        const ctx = cv.getContext('2d');
        ctx.font = '700 40px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff'; ctx.fillText(text, 160, 42);
        const tex = new THREE.CanvasTexture(cv);
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
        spr.center.set(0.5, -0.1); spr.scale.set(3.0, 0.75, 1);
        return spr;
    };
    const nodes = [], tmp = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2;
        const base = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
        const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false }));
        dot.position.copy(base); group.add(dot);
        const label = makeLabel(WORDS[i]); label.position.copy(base); group.add(label);
        nodes.push({ dot, label });
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false }));
    halo.scale.set(2.0, 2.0, 1); group.add(halo);
    const hubCanvas = document.createElement('canvas'); hubCanvas.width = hubCanvas.height = 256;
    const hubCtx = hubCanvas.getContext('2d');
    const hubTex = new THREE.CanvasTexture(hubCanvas);
    const hub = new THREE.Sprite(new THREE.SpriteMaterial({ map: hubTex, transparent: true, depthWrite: false }));
    hub.scale.set(2.15, 2.15, 1); group.add(hub);

    const PCOUNT = window.innerWidth < 640 ? 9 : 16, pState = [], pPos = new Float32Array(PCOUNT * 3);
    for (let i = 0; i < PCOUNT; i++) pState.push({ a0: Math.random() * Math.PI * 2, sp: 0.25 + Math.random() * 0.45, r: R + (Math.random() - 0.5) * 0.4 });
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    const pMat = new THREE.PointsMaterial({ map: dotTex, size: 0.5, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
    group.add(new THREE.Points(pGeo, pMat));

    const palette = { node: new THREE.Color(), hot: new THREE.Color(), signal: new THREE.Color(), muted: new THREE.Color('#64748B') };
    s.applyThemeSelf = () => {
        const dark = isDark();
        palette.node = colorOf('--scene-node', '#0047BB'); palette.hot = colorOf('--scene-hot', '#00B894'); palette.signal = colorOf('--scene-signal', '#0090FF');
        palette.muted = new THREE.Color(cssVar('--muted', '#64748B'));
        ringMat.color = palette.signal.clone(); ringMat.opacity = dark ? 0.3 : 0.42;
        halo.material.color = palette.signal.clone();
        drawMonogram(hubCtx, 256, cssVar('--accent', '#0047BB'), cssVar('--scene-line', '#3F7AD6')); hubTex.needsUpdate = true;
        const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        nodes.forEach((n) => { n.dot.material.blending = blend; });
        halo.material.blending = blend; pMat.color = palette.signal.clone(); pMat.blending = blend;
    };
    s.applyThemeSelf();

    /* camera fit (baseZ) recomputed per-frame from the manager-set aspect */
    const fitZ = () => {
        const halfT = Math.tan((40 * Math.PI / 180) / 2);
        const contentW = 2 * R + 3.0, contentH = 2 * R * Math.sin(TILT) + 1.8;
        const zW = (contentW * 0.5) / (halfT * (camera.aspect || 1)), zH = (contentH * 0.5) / halfT;
        return Math.max(zW, zH) * 1.04;
    };

    let hovered = false;
    if (!REDUCED_MOTION) {
        el.addEventListener('pointerenter', () => { hovered = true; });
        el.addEventListener('pointerleave', () => { hovered = false; });
    }
    const WORD_LINKS = [
        'https://muhammadsyafrudin.com/courses',
        'https://courses.muhammadsyafrudin.com/about',
        'https://muhammadsyafrudin.com/research',
        'https://muhammadsyafrudin.com/contact'
    ];
    const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pickNode = (clientX, clientY) => {
        const r = el.getBoundingClientRect();
        ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
        ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const targets = nodes.flatMap((n) => [n.dot, n.label]);
        const hit = raycaster.intersectObjects(targets, false)[0];
        return hit ? nodes.findIndex((n) => n.dot === hit.object || n.label === hit.object) : -1;
    };
    el.addEventListener('pointermove', (e) => { el.style.cursor = pickNode(e.clientX, e.clientY) >= 0 ? 'pointer' : 'default'; });
    el.addEventListener('click', (e) => { const idx = pickNode(e.clientX, e.clientY); if (idx >= 0 && WORD_LINKS[idx]) window.open(WORD_LINKS[idx], '_blank', 'noopener'); });

    let animT = 0, lastNow = 0;
    const mutedC = new THREE.Color();
    s.update = (t) => {
        const dt = Math.min(Math.max(t - lastNow, 0), 0.05); lastNow = t;
        if (!hovered) animT += dt;
        const tt = animT;
        const baseZ = fitZ();
        camera.position.z += ((hovered ? baseZ * 1.3 : baseZ) - camera.position.z) * 0.08;
        group.rotation.y = tt * 0.32;
        group.rotation.x = -TILT + Math.sin(tt * 0.4) * 0.05;
        halo.material.opacity = 0.22 + 0.1 * Math.sin(tt * 2);
        let maxZ = -1e9, minZ = 1e9;
        const zs = nodes.map((n) => { n.dot.getWorldPosition(tmp); return tmp.z; });
        zs.forEach((z) => { if (z > maxZ) maxZ = z; if (z < minZ) minZ = z; });
        const span = (maxZ - minZ) || 1;
        nodes.forEach((n, i) => {
            const f = (zs[i] - minZ) / span, front = f * f * f;
            n.dot.material.color.copy(palette.node).lerp(palette.hot, front);
            n.dot.material.opacity = 0.3 + 0.7 * f;
            const ds = 0.85 + 0.9 * front; n.dot.scale.set(ds, ds, 1);
            mutedC.copy(palette.muted).lerp(palette.hot, front);
            n.label.material.color.copy(mutedC); n.label.material.opacity = 0.4 + 0.6 * f;
            const ls = 1 + 0.3 * front; n.label.scale.set(3.0 * ls, 0.75 * ls, 1);
        });
        for (let i = 0; i < PCOUNT; i++) { const a = pState[i].a0 + tt * pState[i].sp; pPos[i * 3] = Math.cos(a) * pState[i].r; pPos[i * 3 + 2] = Math.sin(a) * pState[i].r; }
        pGeo.getAttribute('position').needsUpdate = true;
        pMat.opacity = 0.4 + 0.12 * Math.sin(tt * 1.5);
    };

    const fb = el.parentElement && el.parentElement.querySelector('.about-cycle-fallback');
    if (fb) fb.style.display = 'none';
    return s;
}
