/* academic-page v2.0.0 "Applied Intelligence" | (c) 2026 by Muhammad Syafrudin */

const YOUR_ORCID = "0000-0002-5640-4413"; // change this value with your actual ORCID
const API_BACKEND_URL = "https://s.aintlab.com"; // change this with your API_BACKEND_URL
const YOUR_GS_ID = "WLTzkOMAAAAJ";

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cache DOM elements
const elements = {
    yearofexp: document.getElementById("yearofexp"),
    footerInfo: document.getElementById('additionalInfo'),
    workCountText: document.getElementById("workCountText"),
    citedCount: document.getElementById("citedCount"),
    outletCount: document.getElementById("outletCount"),
    recentUpdates: document.getElementById('recentUpdates')
};

/* ---------- Animated counters ---------- */
const animateCount = (el, target) => {
    if (!el) return;
    const value = Number(target);
    if (!isFinite(value)) { el.textContent = target; return; }
    const fmt = (n) => n.toLocaleString('en-US');
    if (REDUCED_MOTION) { el.textContent = fmt(value); return; }
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(value * eased));
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

// Years of experience since 2014
animateCount(elements.yearofexp, new Date().getFullYear() - 2014);

/* ---------- Live scholar / ORCID data ---------- */
const fetchWorks = async () => {
    try {
        const response = await axios.get(`${API_BACKEND_URL}/authorid/${YOUR_GS_ID}.json`);
        const workItems = response.data;

        if (workItems) {
            animateCount(elements.workCountText, workItems.total_papers);
            animateCount(elements.citedCount, workItems.total_citations);
            elements.footerInfo.innerHTML = `<p class="italic">(*) Publications and citations from <a href="${workItems.gs_id}&view_op=list_works&sortby=pubdate" target="_blank" class="link">Google Scholar</a>, (**) reviews from <a href="https://orcid.org/${YOUR_ORCID}" target="_blank" class="link">ORCID</a>. Updated ${workItems.updated}.</p>`;
        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

const fetchReviews = async () => {
    try {
        const response = await axios.get(`${API_BACKEND_URL}/orcid/${YOUR_ORCID}/reviews.json`);
        const workItems = response.data;

        if (workItems) {
            animateCount(elements.outletCount, workItems.total_outlets);
        }
        return workItems;
    } catch (errors) {
        console.error(errors);
    }
};

const fetchUpdates = async () => {
    try {
        const response = await axios.get('https://research.muhammadsyafrudin.com/updates/rss.xml');
        const rssdataxml = response.data;
        const updatedata = fromXML(rssdataxml);
        const recentupdates = updatedata.rss.channel.item.slice(0, 4);

        let updates = recentupdates.map(item =>
            `<a href='${item.link}' target='_blank' class='link' data-tippy-content='View this update'>${item.title}</a>`
        ).join(', ');

        updates += `, <a href='https://research.muhammadsyafrudin.com/updates' class='link' data-tippy-content='View all updates' target='_blank'>All updates</a>`;
        elements.recentUpdates.innerHTML = updates;
    } catch (errors) {
        console.error(errors);
    }
};

const init = async () => {
    await Promise.all([
        fetchWorks(),
        fetchReviews(),
        fetchUpdates()
    ]);
};

init();

const yearbuild = document.getElementById("yearbuild");
yearbuild.innerHTML = new Date().getFullYear();

// Init tooltips
tippy('.link', {
    placement: 'bottom'
})

/* ---------- Theme toggle (light/dark), persisted ---------- */
const toggle = document.querySelector('.js-change-theme');
const root = document.documentElement;

const setToggleIcon = () => {
    toggle.innerHTML = root.classList.contains('dark') ? '🌞' : '🌛';
};
setToggleIcon();

toggle.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    setToggleIcon();
    document.dispatchEvent(new CustomEvent('aint:theme'));
});

/* ---------- Scroll reveal ---------- */
if (!REDUCED_MOTION && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
} else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

/* ============================================================
   Applied Intelligence — three.js Vision-Transformer hero
   A living ViT pipeline: an input image is split into patches,
   linearly projected + positionally embedded into a token
   sequence, contextualised by multi-head self-attention, then
   the [CLS] token is read out by an MLP head into class scores.
   three.min.js is lazy-loaded so the initial paint stays fast;
   if WebGL or the script fails, the hero quietly falls back to
   the CSS gradient background.
   ============================================================ */
/* three.min.js is loaded once and shared by every scene on the page (the hero
   ViT and the About cycle); callbacks queue until the script is ready. */
let _threeLoading = false;
const _threeQueue = [];
const loadThree = (cb) => {
    if (window.THREE) { cb(); return; }
    _threeQueue.push(cb);
    if (_threeLoading) return;
    _threeLoading = true;
    const script = document.createElement('script');
    script.src = 'js/three.min.js';
    script.async = true;
    script.onload = () => { while (_threeQueue.length) { try { _threeQueue.shift()(); } catch (e) { console.error(e); } } };
    script.onerror = () => { _threeLoading = false; _threeQueue.length = 0; };
    document.head.appendChild(script);
};

const initAppliedIntelligence = () => {
    const canvas = document.getElementById('aintel-canvas');
    if (!canvas || !window.WebGLRenderingContext) return;
    loadThree(() => {
        try { buildAintelScene(canvas); }
        catch (e) { console.error(e); canvas.style.display = 'none'; }
    });
};

const initAboutCycle = () => {
    const canvas = document.getElementById('about-canvas');
    if (!canvas || !window.WebGLRenderingContext) return;
    loadThree(() => {
        try { buildCycleScene(canvas); }
        catch (e) { console.error(e); }
    });
};

const initBrandLogo = () => {
    const canvas = document.getElementById('brand-canvas');
    if (!canvas || !window.WebGLRenderingContext) return;
    loadThree(() => {
        try { buildBrandScene(canvas); }
        catch (e) { console.error(e); canvas.style.display = 'none'; }
    });
};

const cssVarColor = (name, fallback) => {
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    return new THREE.Color(v || fallback);
};

function buildAintelScene(canvas) {
    const renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: true, powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 0, 30);

    const small = window.innerWidth < 640;

    /* ===== Vision-Transformer pipeline layout (flows left → right) =====
       INPUT IMAGE → PATCHES → PATCH + POSITION EMBED (token sequence)
       → MULTI-HEAD SELF-ATTENTION (encoder ×N) → [CLS] → MLP HEAD
       → OUTPUT class probabilities                                       */
    const GRID = small ? 3 : 4;               // GRID×GRID image patches
    const NPATCH = GRID * GRID;
    const TILE = small ? 1.55 : 2.0;          // patch edge length
    const EXPLODE = small ? 0.4 : 0.55;       // gap between exploded patches
    const IMG_X = small ? -8.0 : -21;         // wider spread now the headline is gone
    const SEQ_X = small ? -0.9 : -4;
    const MLP_X = small ? 4.4 : 9;
    const OUT_X = small ? 5.0 : 16;
    const TOKEN_GAP = small ? 1.15 : 0.95;    // vertical spacing in the sequence
    const MAXLEN = small ? 2.3 : 5.0;         // longest output probability bar
    const PART_COUNT = small ? 16 : 30;       // patch → token embedding particles
    const READ_COUNT = small ? 5 : 9;         // [CLS] → MLP → output particles
    const DUST_COUNT = small ? 40 : 80;
    const SCENE_Y = small ? 3.8 : 4.0;        // raise the pipeline into the hero's UPPER band,
    //                                           with the identity text centred below it

    const group = new THREE.Group();
    group.position.y = SCENE_Y;
    scene.add(group);

    /* ---------- glow-sprite shader shared by tokens / particles / dust ---------- */
    const makePointsMaterial = (opts) => new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uWave: { value: -999 },
            uPR: { value: renderer.getPixelRatio() },
            uColor: { value: new THREE.Color('#0047BB') },
            uColorB: { value: new THREE.Color('#0090FF') },
            uCore: { value: new THREE.Color('#FFFFFF') },
            uOpacity: { value: opts.opacity }
        },
        vertexShader: [
            'uniform float uTime; uniform float uWave; uniform float uPR;',
            'attribute float aSeed; attribute float aSize; attribute float aMix;',
            'varying float vGlow; varying float vMix;',
            'void main() {',
            '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
            '  float pulse = 0.85 + 0.25 * sin(uTime * 1.7 + aSeed * 6.2831);',
            '  float wave = smoothstep(4.5, 0.0, abs(position.x - uWave));',
            '  vGlow = wave;',
            '  vMix = aMix;',
            '  gl_PointSize = aSize * uPR * pulse * (1.0 + wave * 0.9) * (140.0 / -mv.z);',
            '  gl_Position = projectionMatrix * mv;',
            '}'
        ].join('\n'),
        fragmentShader: [
            'uniform vec3 uColor; uniform vec3 uColorB; uniform vec3 uCore; uniform float uOpacity;',
            'varying float vGlow; varying float vMix;',
            'void main() {',
            '  float d = distance(gl_PointCoord, vec2(0.5));',
            '  float alpha = smoothstep(0.5, 0.12, d);',
            '  float core = smoothstep(0.22, 0.0, d);',
            '  vec3 col = mix(mix(uColor, uColorB, vMix), uCore, core * 0.75 + vGlow * 0.2);',
            '  gl_FragColor = vec4(col, alpha * uOpacity * (0.75 + vGlow * 0.25));',
            '  if (gl_FragColor.a < 0.01) discard;',
            '}'
        ].join('\n'),
        transparent: true,
        depthWrite: false
    });

    const buildPoints = (positions, sizeMin, sizeMax, opacity, mix) => {
        const geo = new THREE.BufferGeometry();
        const n = positions.length / 3;
        const seeds = new Float32Array(n);
        const sizes = new Float32Array(n);
        const mixes = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            seeds[i] = Math.random();
            sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
            mixes[i] = mix ? mix[i] : 0;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('aMix', new THREE.BufferAttribute(mixes, 1));
        return new THREE.Points(geo, makePointsMaterial({ opacity }));
    };

    /* ---------- procedural input image (canvas texture) ---------- */
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = imgCanvas.height = 256;
    (() => {
        const c = imgCanvas.getContext('2d');
        const sky = c.createLinearGradient(0, 0, 0, 256);
        sky.addColorStop(0.00, '#0b1e4d');
        sky.addColorStop(0.42, '#2059a6');
        sky.addColorStop(0.66, '#f0a35a');
        sky.addColorStop(1.00, '#f7d78e');
        c.fillStyle = sky; c.fillRect(0, 0, 256, 256);
        // sun halo
        const sun = c.createRadialGradient(184, 92, 3, 184, 92, 52);
        sun.addColorStop(0, '#fff7e6'); sun.addColorStop(1, 'rgba(255,220,150,0)');
        c.fillStyle = sun; c.beginPath(); c.arc(184, 92, 52, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff2cf'; c.beginPath(); c.arc(184, 92, 15, 0, Math.PI * 2); c.fill();
        // layered mountain ridges
        const ridge = (base, h, phase, col) => {
            c.fillStyle = col; c.beginPath(); c.moveTo(0, 256);
            for (let x = 0; x <= 256; x += 16) {
                const y = base - Math.abs(Math.sin(x * 0.03 + phase)) * h;
                c.lineTo(x, y);
            }
            c.lineTo(256, 256); c.closePath(); c.fill();
        };
        ridge(188, 58, 0.4, '#2b3f72');
        ridge(210, 44, 2.1, '#212f57');
        ridge(234, 32, 3.6, '#141d39');
    })();
    const imgTex = new THREE.CanvasTexture(imgCanvas);
    imgTex.minFilter = THREE.LinearFilter;

    /* ---------- patches: GRID×GRID textured tiles that explode ---------- */
    const patches = [];
    const patchEdgeMats = [];
    const patchImg = [];    // assembled (full-image) position
    const patchHome = [];   // exploded target position
    const gridC = (GRID - 1) / 2;
    for (let r = 0; r < GRID; r++) {
        for (let col = 0; col < GRID; col++) {
            const geo = new THREE.PlaneGeometry(TILE * 0.94, TILE * 0.94);
            // remap UVs to this tile's window of the image
            const u0 = col / GRID, u1 = (col + 1) / GRID;
            const v0 = 1 - (r + 1) / GRID, v1 = 1 - r / GRID;
            const uv = geo.getAttribute('uv');
            uv.setXY(0, u0, v1); uv.setXY(1, u1, v1);
            uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
            uv.needsUpdate = true;

            const mat = new THREE.MeshBasicMaterial({ map: imgTex, transparent: true, opacity: 0.97 });
            const mesh = new THREE.Mesh(geo, mat);
            const cx = col - gridC, cy = gridC - r;
            patchImg.push(new THREE.Vector3(IMG_X + cx * TILE, cy * TILE, 0));
            patchHome.push(new THREE.Vector3(
                IMG_X + cx * (TILE + EXPLODE),
                cy * (TILE + EXPLODE),
                (Math.random() - 0.5) * 1.4
            ));
            mesh.position.copy(patchImg[patchImg.length - 1]);

            const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
            patchEdgeMats.push(edgeMat);

            group.add(mesh);
            patches.push(mesh);
        }
    }

    /* Swap in the real profile photo as the ViT input once it loads; the
       procedural image above remains as a fallback if the fetch/decode fails. */
    new THREE.TextureLoader().load('img/profile_mobile.webp', (photo) => {
        photo.minFilter = THREE.LinearFilter;
        patches.forEach((p) => { p.material.map = photo; p.material.needsUpdate = true; });
    }, undefined, () => { /* keep the procedural fallback */ });

    /* ---------- token sequence: [CLS] + one token per patch ---------- */
    const TOK = NPATCH + 1;
    const tokenPos = [];
    const tokenMix = [];
    const colTop = ((TOK - 1) / 2) * TOKEN_GAP;
    for (let i = 0; i < TOK; i++) {
        tokenPos.push(new THREE.Vector3(SEQ_X, colTop - i * TOKEN_GAP, 0));
        tokenMix.push(i / (TOK - 1));
    }
    const patchTokPos = [];
    tokenPos.forEach((v) => patchTokPos.push(v.x, v.y, v.z));
    const tokens = buildPoints(patchTokPos, 1.9, 2.4, 0.95, tokenMix);
    group.add(tokens);

    // distinct, brighter [CLS] token sitting at the head of the sequence
    const clsPoint = buildPoints([tokenPos[0].x, tokenPos[0].y, tokenPos[0].z], 3.4, 3.4, 1.0);
    group.add(clsPoint);

    /* ---------- stacked encoder blocks behind the sequence (×N depth) ---------- */
    const panels = [];
    const panelW = small ? 3.4 : 4.2;
    const panelH = colTop * 2 + (small ? 2 : 2.6);
    for (let k = 0; k < 3; k++) {
        const pm = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false });
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(panelW - k * 0.35, panelH - k * 0.6), pm);
        panel.position.set(SEQ_X, 0, -1.2 - k * 1.5);
        group.add(panel);
        panels.push(panel);
    }

    /* ---------- self-attention: line between every token pair (i<j) ---------- */
    const pairs = [];
    for (let i = 0; i < TOK; i++)
        for (let j = i + 1; j < TOK; j++) pairs.push([i, j]);
    const attnPos = new Float32Array(pairs.length * 6);
    const attnCol = new Float32Array(pairs.length * 6);
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

    /* ---------- MLP head nodes ---------- */
    const mlpPos = [];
    const MLP_N = 3;
    for (let i = 0; i < MLP_N; i++) mlpPos.push(new THREE.Vector3(MLP_X, (i - (MLP_N - 1) / 2) * 2.2, 0));
    const mlpFlat = [];
    mlpPos.forEach((v) => mlpFlat.push(v.x, v.y, v.z));
    const mlpNodes = buildPoints(mlpFlat, 2.4, 2.8, 0.95);
    group.add(mlpNodes);
    // faint links CLS → MLP → (all outputs handled by particles)
    const mlpLinkPos = [];
    mlpPos.forEach((v) => { mlpLinkPos.push(tokenPos[0].x, tokenPos[0].y, tokenPos[0].z, v.x, v.y, v.z); });
    const mlpLinkGeo = new THREE.BufferGeometry();
    mlpLinkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mlpLinkPos), 3));
    const mlpLinkMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false });
    group.add(new THREE.LineSegments(mlpLinkGeo, mlpLinkMat));

    /* ---------- output: multi-label probability bars ----------
       the ViT tags the input photo with several attributes, so more than one
       class "fires" (the `on` flag) rather than a single arg-max winner. */
    const CLASSES = [
        { name: 'RESEARCHER', p: 0.98, on: true },
        { name: 'EDUCATOR', p: 0.94, on: true },
        { name: 'AI · DS', p: 0.91, on: true },
        { name: 'BIG DATA', p: 0.84, on: false },
        { name: 'ANALYTICS', p: 0.72, on: false }
    ];
    const nClass = small ? 4 : CLASSES.length;
    const BAR_GAP = small ? 1.5 : 1.7;
    const BAR_H = small ? 0.7 : 0.85;
    const bars = [];
    const trackMats = [];
    for (let i = 0; i < nClass; i++) {
        const y = ((nClass - 1) / 2 - i) * BAR_GAP;
        // track
        const tGeo = new THREE.PlaneGeometry(1, BAR_H); tGeo.translate(0.5, 0, 0);
        const tMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false });
        const track = new THREE.Mesh(tGeo, tMat);
        track.position.set(OUT_X, y, -0.1); track.scale.x = MAXLEN;
        group.add(track); trackMats.push(tMat);
        // fill
        const bGeo = new THREE.PlaneGeometry(1, BAR_H); bGeo.translate(0.5, 0, 0);
        const bMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false });
        const bar = new THREE.Mesh(bGeo, bMat);
        bar.position.set(OUT_X, y, 0); bar.scale.x = MAXLEN * CLASSES[i].p;
        group.add(bar);
        const len = MAXLEN * CLASSES[i].p;
        bars.push({ mesh: bar, mat: bMat, y, len, on: CLASSES[i].on, tip: new THREE.Vector3(OUT_X + len, y, 0) });
    }
    // active labels the readout particles fly to
    const activeBars = bars.filter((b) => b.on);

    /* ---------- embedding particles: patch → token ---------- */
    const embState = [];
    const embPos = new Float32Array(PART_COUNT * 3);
    for (let i = 0; i < PART_COUNT; i++) {
        embState.push({ p: (i % NPATCH), tk: 1 + (i % (TOK - 1)), t: Math.random(), sp: 0.3 + Math.random() * 0.5 });
    }
    const embParticles = buildPoints(embPos, 1.0, 1.4, 1.0);
    embParticles.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
    group.add(embParticles);

    /* ---------- readout particles: [CLS] → MLP → winning class ---------- */
    const readState = [];
    const readPos = new Float32Array(READ_COUNT * 3);
    for (let i = 0; i < READ_COUNT; i++) {
        readState.push({ t: Math.random(), sp: 0.35 + Math.random() * 0.4, node: i % MLP_N, bar: activeBars[i % activeBars.length] });
    }
    const readParticles = buildPoints(readPos, 1.1, 1.5, 1.0);
    readParticles.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
    group.add(readParticles);

    /* ---------- ambient dust ---------- */
    const dustPos = [];
    for (let i = 0; i < DUST_COUNT; i++) {
        dustPos.push((Math.random() - 0.5) * 66, (Math.random() - 0.5) * 34, (Math.random() - 0.5) * 24 - 4);
    }
    const dust = buildPoints(dustPos, 0.35, 0.6, 0.25);
    scene.add(dust);

    /* ---------- HUD stage captions + class tags ---------- */
    const makeText = (text, opts) => {
        const cv = document.createElement('canvas');
        cv.width = 512; cv.height = 80;
        const ctx = cv.getContext('2d');
        const tex = new THREE.CanvasTexture(cv);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        sprite.scale.set(opts.w, opts.w * (80 / 512), 1);
        sprite.userData.draw = (color, alpha) => {
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.font = (opts.weight || 700) + ' ' + (opts.size || 34) + 'px system-ui, -apple-system, sans-serif';
            ctx.textAlign = opts.align || 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha == null ? 0.9 : alpha;
            const x = opts.align === 'left' ? 8 : cv.width / 2;
            ctx.fillText(opts.spaced ? text.split('').join(' ') : text, x, cv.height / 2);
            tex.needsUpdate = true;
        };
        return sprite;
    };

    // four captions aligned to the four visual clusters; widths (l.w) are the
    // base sprite size, re-scaled by the scene factor s in resize() so they
    // shrink with the pipeline and never collide horizontally.
    const stageLabels = [
        { s: makeText('IMAGE → PATCHES', { w: 7.5, size: 27, spaced: true }), w: 7.5, x: () => IMG_X },
        { s: makeText('EMBED + ATTENTION', { w: 8.5, size: 27, spaced: true }), w: 8.5, x: () => SEQ_X },
        { s: makeText('MLP HEAD', { w: 5, size: 27, spaced: true }), w: 5, x: () => MLP_X },
        { s: makeText('MULTI-LABEL', { w: 7, size: 27, spaced: true }), w: 7, x: () => OUT_X + MAXLEN * 0.5 }
    ];
    stageLabels.forEach((l) => scene.add(l.s));

    const clsTag = makeText('[CLS]', { w: small ? 2.6 : 3.2, size: 30 });
    group.add(clsTag);

    const classTags = [];
    for (let i = 0; i < nClass; i++) {
        const t = makeText(CLASSES[i].name, { w: small ? 4.6 : 6, size: 30, align: 'left' });
        t.position.set(OUT_X + MAXLEN + (small ? 1.5 : 3.6), bars[i].y, 0);
        group.add(t);
        classTags.push(t);
    }

    /* ---------- theme-aware palette ---------- */
    const palette = { signal: new THREE.Color(), node: new THREE.Color(), hot: new THREE.Color(), line: new THREE.Color() };
    const applyTheme = () => {
        const dark = root.classList.contains('dark');
        const nodeColor = cssVarColor('--scene-node', '#0047BB');
        const lineColor = cssVarColor('--scene-line', '#3F7AD6');
        const signalColor = cssVarColor('--scene-signal', '#0090FF');
        const dustColor = cssVarColor('--scene-dust', '#9FBDEB');
        const hotColor = cssVarColor('--scene-hot', '#00B894');
        palette.signal.copy(signalColor);
        palette.node.copy(nodeColor);
        palette.hot.copy(hotColor);
        palette.line.copy(lineColor);
        const glowBlend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        const core = new THREE.Color(dark ? '#FFFFFF' : '#002B70');

        tokens.material.uniforms.uColor.value = signalColor;
        tokens.material.uniforms.uColorB.value = nodeColor;
        tokens.material.uniforms.uCore.value = core;
        clsPoint.material.uniforms.uColor.value = hotColor;
        clsPoint.material.uniforms.uColorB.value = hotColor;
        clsPoint.material.uniforms.uCore.value = new THREE.Color('#FFFFFF');
        mlpNodes.material.uniforms.uColor.value = nodeColor;
        mlpNodes.material.uniforms.uColorB.value = signalColor;
        mlpNodes.material.uniforms.uCore.value = core;
        embParticles.material.uniforms.uColor.value = signalColor;
        embParticles.material.uniforms.uCore.value = new THREE.Color('#FFFFFF');
        readParticles.material.uniforms.uColor.value = hotColor;
        readParticles.material.uniforms.uCore.value = new THREE.Color('#FFFFFF');
        dust.material.uniforms.uColor.value = dustColor;
        dust.material.uniforms.uCore.value = dustColor;

        [tokens, clsPoint, mlpNodes, embParticles, readParticles, dust].forEach((o) => {
            o.material.blending = glowBlend; o.material.needsUpdate = true;
        });
        attnMat.blending = glowBlend;

        patchEdgeMats.forEach((m) => { m.color = lineColor; m.opacity = dark ? 0.5 : 0.6; });
        panels.forEach((p) => { p.material.color = nodeColor; p.material.opacity = dark ? 0.07 : 0.05; });
        mlpLinkMat.color = lineColor; mlpLinkMat.opacity = dark ? 0.16 : 0.2;

        bars.forEach((b) => b.mat.color = b.on ? hotColor : lineColor);
        trackMats.forEach((m) => { m.color = lineColor; m.opacity = dark ? 0.1 : 0.14; });

        const muted = getComputedStyle(root).getPropertyValue('--muted').trim() || '#64748B';
        stageLabels.forEach((l) => l.s.userData.draw(muted));
        clsTag.userData.draw('#' + hotColor.getHexString(), 0.95);
        classTags.forEach((t, i) => {
            const on = bars[i] && bars[i].on;
            t.userData.draw(on ? '#' + hotColor.getHexString() : muted, on ? 1 : 0.6);
        });
    };
    applyTheme();

    /* ---------- sizing ---------- */
    const resize = () => {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // larger now that the headline is gone, but still bounded to the lower band
        const s = Math.max(0.5, Math.min(0.78, camera.aspect / 2.2));
        group.scale.setScalar(s);
        // captions sit just above the lowered pipeline (group is offset by SCENE_Y)
        // and scale with the scene so they track their stage and don't overlap
        const labelY = SCENE_Y + s * colTop + (small ? 0.45 : 0.4);
        stageLabels.forEach((l) => {
            const lw = l.w * s;
            l.s.scale.set(lw, lw * (80 / 512), 1);
            l.s.position.set(l.x() * s, labelY, 0);
        });
    };
    resize();

    /* ---------- pointer parallax ---------- */
    let targetRX = 0, targetRY = 0;
    window.addEventListener('pointermove', (e) => {
        const mx = e.clientX / window.innerWidth - 0.5;
        const my = e.clientY / window.innerHeight - 0.5;
        targetRY = mx * 0.2;
        targetRX = -my * 0.12;
    }, { passive: true });

    /* ---------- helpers for the render loop ---------- */
    const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();

    const clock = new THREE.Clock();
    let rafId = 0;
    let heroVisible = true;

    const renderFrame = () => {
        const t = clock.getElapsedTime();

        // intro: patches assemble → explode over the first moments
        const ex = REDUCED_MOTION ? 1 : smooth((t - 0.4) / 1.8);
        for (let i = 0; i < NPATCH; i++) {
            patches[i].position.lerpVectors(patchImg[i], patchHome[i], ex);
            // raster-scan highlight sweeping across the patch grid
            const scan = (t * 3.0) % (NPATCH + 4);
            const d = Math.abs(i - scan);
            patches[i].material.color.setScalar(1 + 1.1 * Math.max(0, 1 - d / 1.3) * ex);
        }

        // living 3D sway (constant orbit) + pointer parallax, for real depth
        const driftY = Math.sin(t * 0.13) * 0.13;
        const driftX = Math.sin(t * 0.08) * 0.045;
        group.rotation.y += (targetRY + driftY - group.rotation.y) * 0.05;
        group.rotation.x += (targetRX + driftX - group.rotation.x) * 0.05;
        dust.rotation.y = t * 0.012;

        // pipeline pulse wave sweeping input → output
        const head = -26 + ((t * 12) % 62);
        [tokens, clsPoint, mlpNodes, embParticles, readParticles].forEach((o) => {
            o.material.uniforms.uTime.value = t;
            o.material.uniforms.uWave.value = head;
        });
        dust.material.uniforms.uTime.value = t;

        // encoder blocks breathe
        panels.forEach((p, k) => { p.material.opacity = (0.05 + 0.03 * (0.5 + 0.5 * Math.sin(t * 1.2 - k))) ; });

        // embedding particles: patch → token
        const eAttr = embParticles.geometry.getAttribute('position');
        for (let i = 0; i < PART_COUNT; i++) {
            const st = embState[i];
            st.t += st.sp * 0.016;
            if (st.t >= 1) { st.t = 0; st.p = Math.floor(Math.random() * NPATCH); st.tk = 1 + Math.floor(Math.random() * (TOK - 1)); st.sp = 0.3 + Math.random() * 0.5; }
            const e = smooth(st.t);
            tmpA.copy(patchHome[st.p]); tmpB.copy(tokenPos[st.tk]);
            eAttr.array[i * 3] = tmpA.x + (tmpB.x - tmpA.x) * e;
            eAttr.array[i * 3 + 1] = tmpA.y + (tmpB.y - tmpA.y) * e;
            eAttr.array[i * 3 + 2] = tmpA.z + (tmpB.z - tmpA.z) * e + Math.sin(Math.PI * st.t) * 2.4;
        }
        eAttr.needsUpdate = true;

        // self-attention: a query token sweeps the sequence, lighting its
        // connections to every key; links into [CLS] stay warm (readout).
        const q = (t * 1.6) % TOK;
        for (let i = 0; i < pairs.length; i++) {
            const [a, b] = pairs[i];
            const near = Math.max(1 - Math.abs(a - q), 1 - Math.abs(b - q));
            const toCls = (a === 0 || b === 0) ? 0.5 : 0;
            const inten = Math.max(0.08, Math.max(near, toCls));
            const c = (a === 0 || b === 0) ? palette.hot : palette.signal;
            const o = i * 6;
            attnCol[o] = c.r * inten; attnCol[o + 1] = c.g * inten; attnCol[o + 2] = c.b * inten;
            attnCol[o + 3] = attnCol[o]; attnCol[o + 4] = attnCol[o + 1]; attnCol[o + 5] = attnCol[o + 2];
        }
        attnGeo.getAttribute('color').needsUpdate = true;
        attnMat.opacity = 0.35 + 0.25 * ex;

        // readout particles: [CLS] → MLP node → winning class bar tip
        const rAttr = readParticles.geometry.getAttribute('position');
        for (let i = 0; i < READ_COUNT; i++) {
            const st = readState[i];
            st.t += st.sp * 0.016;
            if (st.t >= 1) { st.t = 0; st.node = Math.floor(Math.random() * MLP_N); st.sp = 0.35 + Math.random() * 0.4; st.bar = activeBars[Math.floor(Math.random() * activeBars.length)]; }
            if (st.t < 0.5) { tmpA.copy(tokenPos[0]); tmpB.copy(mlpPos[st.node]); var e2 = smooth(st.t / 0.5); }
            else { tmpA.copy(mlpPos[st.node]); tmpB.copy(st.bar.tip); e2 = smooth((st.t - 0.5) / 0.5); }
            rAttr.array[i * 3] = tmpA.x + (tmpB.x - tmpA.x) * e2;
            rAttr.array[i * 3 + 1] = tmpA.y + (tmpB.y - tmpA.y) * e2;
            rAttr.array[i * 3 + 2] = tmpA.z + (tmpB.z - tmpA.z) * e2 + Math.sin(Math.PI * (st.t % 0.5) * 2) * 1.2;
        }
        rAttr.needsUpdate = true;

        // active (multi-label) bars pulse; inactive ones sit dim and jitter faintly
        bars.forEach((b, i) => {
            if (b.on) { b.mat.opacity = 0.85 + 0.15 * Math.sin(t * 3.2 + i * 0.6); b.mesh.scale.x = b.len * (0.985 + 0.015 * Math.sin(t * 3.2 + i)); }
            else { b.mat.opacity = 0.6; b.mesh.scale.x = b.len * (0.9 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.7 + i))); }
        });
        clsPoint.material.uniforms.uColor.value.copy(palette.hot);

        // keep the [CLS] tag pinned just above the CLS token
        clsTag.position.set(tokenPos[0].x - (small ? 2.4 : 3.0), tokenPos[0].y, tokenPos[0].z);

        renderer.render(scene, camera);
    };

    const loop = () => {
        renderFrame();
        rafId = requestAnimationFrame(loop);
    };

    const updatePlayState = () => {
        cancelAnimationFrame(rafId);
        if (REDUCED_MOTION) { renderFrame(); return; }
        if (heroVisible && !document.hidden) rafId = requestAnimationFrame(loop);
    };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            heroVisible = entries[0].isIntersecting;
            updatePlayState();
        }, { threshold: 0.02 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', updatePlayState);
    window.addEventListener('resize', () => { resize(); if (REDUCED_MOTION) renderFrame(); });
    document.addEventListener('aint:theme', () => { applyTheme(); if (REDUCED_MOTION) renderFrame(); });

    updatePlayState();
}

/* ============================================================
   About — "Teach · Learn · Research · Collaborate · Repeat"
   A small 3D cycle that fills the free space beside the About
   copy: five words orbit a tilted ring; the word nearest the
   camera lights up as it comes round, so the loop reads as a
   continuous cycle. Shares three.min.js with the hero, pauses
   off-screen, respects reduced motion, and is theme-aware.
   ============================================================ */
function buildCycleScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 15);

    const WORDS = ['Teach', 'Learn', 'Research', 'Collaborate'];
    const N = WORDS.length;
    const R = 3.5;
    const TILT = 0.72;                       // base ring tilt (radians)

    const group = new THREE.Group();
    group.rotation.x = -TILT;               // tilt the ring for perspective
    scene.add(group);

    /* ring outline */
    const SEG = 100, ringArr = new Float32Array((SEG + 1) * 3);
    for (let i = 0; i <= SEG; i++) {
        const a = i / SEG * Math.PI * 2;
        ringArr[i * 3] = Math.cos(a) * R; ringArr[i * 3 + 1] = 0; ringArr[i * 3 + 2] = Math.sin(a) * R;
    }
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringArr, 3));
    const ringMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false });
    group.add(new THREE.Line(ringGeo, ringMat));

    /* soft radial glow sprite shared by nodes + hub */
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

    const makeLabel = (text) => {
        const cv = document.createElement('canvas'); cv.width = 320; cv.height = 80;
        const ctx = cv.getContext('2d');
        ctx.font = '700 40px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff'; ctx.fillText(text, 160, 42);
        const tex = new THREE.CanvasTexture(cv);
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
        spr.center.set(0.5, -0.1);          // sit the word just above its node
        spr.scale.set(3.0, 0.75, 1);
        return spr;
    };

    const nodes = [];
    const tmp = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2;
        const base = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
        const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false }));
        dot.position.copy(base);
        group.add(dot);
        const label = makeLabel(WORDS[i]);
        label.position.copy(base);
        group.add(label);
        nodes.push({ dot, label });
    }

    /* central hub */
    const hub = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false }));
    hub.scale.set(1.6, 1.6, 1);
    group.add(hub);

    /* faint signal particles flowing around the ring */
    const PCOUNT = window.innerWidth < 640 ? 9 : 16;
    const pState = [];
    const pPos = new Float32Array(PCOUNT * 3);
    for (let i = 0; i < PCOUNT; i++) {
        pState.push({ a0: Math.random() * Math.PI * 2, sp: 0.25 + Math.random() * 0.45, r: R + (Math.random() - 0.5) * 0.4 });
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    const pMat = new THREE.PointsMaterial({ map: dotTex, size: 0.5, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    const palette = { node: new THREE.Color(), hot: new THREE.Color(), signal: new THREE.Color(), muted: new THREE.Color('#64748B') };
    const applyTheme = () => {
        const dark = root.classList.contains('dark');
        palette.node = cssVarColor('--scene-node', '#0047BB');
        palette.hot = cssVarColor('--scene-hot', '#00B894');
        palette.signal = cssVarColor('--scene-signal', '#0090FF');
        palette.muted = new THREE.Color(getComputedStyle(root).getPropertyValue('--muted').trim() || '#64748B');
        ringMat.color = palette.signal.clone();
        ringMat.opacity = dark ? 0.3 : 0.42;
        hub.material.color = palette.signal.clone();
        const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        nodes.forEach((n) => { n.dot.material.blending = blend; });
        hub.material.blending = blend;
        pMat.color = palette.signal.clone();
        pMat.blending = blend;
    };
    applyTheme();

    const resize = () => {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // fit the ring (+ label overhang) into the container, whichever of
        // width/height is the tighter constraint, so it fills the space
        const halfT = Math.tan((40 * Math.PI / 180) / 2);
        const contentW = 2 * R + 3.0;
        const contentH = 2 * R * Math.sin(TILT) + 1.8;
        const zW = (contentW * 0.5) / (halfT * camera.aspect);
        const zH = (contentH * 0.5) / halfT;
        camera.position.z = Math.max(zW, zH) * 1.04;
    };
    resize();

    const clock = new THREE.Clock();
    const mutedC = new THREE.Color();
    let rafId = 0, visible = true;

    const frame = () => {
        const t = clock.getElapsedTime();
        group.rotation.y = t * 0.32;
        group.rotation.x = -TILT + Math.sin(t * 0.4) * 0.05;
        hub.material.opacity = 0.22 + 0.1 * Math.sin(t * 2);

        // depth of each node (camera looks down -z, so larger z = nearer)
        let maxZ = -1e9, minZ = 1e9;
        const zs = nodes.map((n) => { n.dot.getWorldPosition(tmp); return tmp.z; });
        zs.forEach((z) => { if (z > maxZ) maxZ = z; if (z < minZ) minZ = z; });
        const span = (maxZ - minZ) || 1;

        nodes.forEach((n, i) => {
            const f = (zs[i] - minZ) / span;    // 0 = back, 1 = front
            const front = f * f * f;            // sharpen the highlight
            n.dot.material.color.copy(palette.node).lerp(palette.hot, front);
            n.dot.material.opacity = 0.3 + 0.7 * f;
            const ds = 0.85 + 0.9 * front;
            n.dot.scale.set(ds, ds, 1);
            mutedC.copy(palette.muted).lerp(palette.hot, front);
            n.label.material.color.copy(mutedC);
            n.label.material.opacity = 0.4 + 0.6 * f;
            const ls = 1 + 0.3 * front;
            n.label.scale.set(3.0 * ls, 0.75 * ls, 1);
        });

        // faint signal particles travelling around the ring
        for (let i = 0; i < PCOUNT; i++) {
            const a = pState[i].a0 + t * pState[i].sp;
            pPos[i * 3] = Math.cos(a) * pState[i].r;
            pPos[i * 3 + 1] = 0;
            pPos[i * 3 + 2] = Math.sin(a) * pState[i].r;
        }
        pGeo.getAttribute('position').needsUpdate = true;
        pMat.opacity = 0.4 + 0.12 * Math.sin(t * 1.5);

        renderer.render(scene, camera);
    };

    const loop = () => { frame(); rafId = requestAnimationFrame(loop); };
    const play = () => {
        cancelAnimationFrame(rafId);
        if (REDUCED_MOTION) { frame(); return; }
        if (visible && !document.hidden) rafId = requestAnimationFrame(loop);
    };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((e) => { visible = e[0].isIntersecting; play(); }, { threshold: 0.05 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', play);
    window.addEventListener('resize', () => { resize(); if (REDUCED_MOTION) frame(); });
    document.addEventListener('aint:theme', () => { applyTheme(); if (REDUCED_MOTION) frame(); });

    // WebGL is live — drop the static fallback
    const fb = canvas.parentElement.querySelector('.about-cycle-fallback');
    if (fb) fb.style.display = 'none';

    play();
}

/* ============================================================
   Brand emblem — an animated 3D "MS" atom that replaces the
   nav "M·S" wordmark. The monogram is the glowing nucleus;
   electrons orbit it on three tilted rings (the atomic-network
   motif of the favicon), spinning up on hover. Shares
   three.min.js via loadThree, reads the same --scene-* / --accent
   theme vars, pauses off-screen / on tab-hide, honours
   prefers-reduced-motion, and falls back to the plain "M·S"
   text if WebGL is unavailable.
   ============================================================ */
function buildBrandScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const cssRaw = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;

    /* soft radial glow used for the nucleus halo + electrons */
    const dotTex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
    })();

    /* --- nucleus: the "MS" monogram drawn to a canvas texture, so its
       colour tracks the brand accent and re-renders on theme change --- */
    const NUC = 256;
    const nucCanvas = document.createElement('canvas'); nucCanvas.width = nucCanvas.height = NUC;
    const nucCtx = nucCanvas.getContext('2d');
    const nucTex = new THREE.CanvasTexture(nucCanvas);
    if (renderer.capabilities.getMaxAnisotropy) nucTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const drawNucleus = (letterCol, ringCol) => {
        const x = nucCtx, C = NUC / 2;
        x.clearRect(0, 0, NUC, NUC);
        x.lineWidth = NUC * 0.05;                 // circular boundary (echoes the favicon)
        x.strokeStyle = ringCol;
        x.beginPath(); x.arc(C, C, NUC * 0.4, 0, Math.PI * 2); x.stroke();
        x.fillStyle = letterCol;                  // bold MS monogram
        x.font = `800 ${NUC * 0.46}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('MS', C, C + NUC * 0.035);
        nucTex.needsUpdate = true;
    };
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, depthTest: false }));
    halo.scale.set(3.2, 3.2, 1);
    scene.add(halo);
    const nucleus = new THREE.Sprite(new THREE.SpriteMaterial({ map: nucTex, transparent: true, depthWrite: false, depthTest: false }));
    nucleus.scale.set(2.05, 2.05, 1);
    scene.add(nucleus);

    /* --- orbits: three flattened ellipses at 0/60/120°, each carrying one
       electron. The whole atom spins; a small x-tilt gives real depth --- */
    const orbit = new THREE.Group();
    scene.add(orbit);

    const R = 1.32, RY = R * 0.42, SEG = 90, NRINGS = 3;
    const rings = [];
    const spd = [1.15, -0.9, 1.4], phase = [0, 2.1, 4.2];
    for (let r = 0; r < NRINGS; r++) {
        const g = new THREE.Group();
        g.rotation.z = r * (Math.PI / NRINGS);
        orbit.add(g);

        const arr = new Float32Array((SEG + 1) * 3);
        for (let i = 0; i <= SEG; i++) {
            const a = i / SEG * Math.PI * 2;
            arr[i * 3] = Math.cos(a) * R; arr[i * 3 + 1] = Math.sin(a) * RY; arr[i * 3 + 2] = 0;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
        g.add(new THREE.Line(geo, mat));

        const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, depthTest: false }));
        e.scale.set(0.5, 0.5, 1);
        g.add(e);

        rings.push({ mat, electron: e, sp: spd[r], ph: phase[r] });
    }

    const palette = { line: new THREE.Color(), hot: new THREE.Color(), signal: new THREE.Color() };
    const applyTheme = () => {
        const dark = root.classList.contains('dark');
        palette.line = cssVarColor('--scene-line', '#3F7AD6');
        palette.hot = cssVarColor('--scene-hot', '#00B894');
        palette.signal = cssVarColor('--scene-signal', '#0090FF');
        drawNucleus(cssRaw('--accent', '#0047BB'), cssRaw('--scene-line', '#3F7AD6'));
        const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        rings.forEach((r) => {
            r.mat.color = palette.line.clone();
            r.mat.opacity = dark ? 0.5 : 0.62;
            r.electron.material.color = palette.hot.clone();
            r.electron.material.blending = blend;
        });
        halo.material.color = palette.signal.clone();
        halo.material.opacity = dark ? 0.22 : 0.1;
        halo.material.blending = blend;
    };
    applyTheme();

    const resize = () => {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth || 48;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight || 48;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    resize();

    /* hover spins the atom up and brightens it */
    const anchor = canvas.closest('.hero-brand') || canvas.parentElement;
    let spin = 1, spinTarget = 1;
    if (!REDUCED_MOTION && anchor) {
        anchor.addEventListener('pointerenter', () => { spinTarget = 2.7; });
        anchor.addEventListener('pointerleave', () => { spinTarget = 1; });
    }

    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    let rafId = 0, visible = true;

    const frame = () => {
        const t = clock.getElapsedTime();
        spin += (spinTarget - spin) * 0.08;

        orbit.rotation.z = t * 0.22 * spin;
        orbit.rotation.x = 0.34 + Math.sin(t * 0.6) * 0.1;
        orbit.rotation.y = Math.sin(t * 0.42) * 0.12;

        const hot = spin > 1.4;
        rings.forEach((r) => {
            const a = r.ph + t * r.sp * spin;
            r.electron.position.set(Math.cos(a) * R, Math.sin(a) * RY, 0);
            r.electron.getWorldPosition(tmp);
            const front = tmp.z > 0;                 // dim electrons behind the nucleus
            r.electron.material.opacity = front ? 1 : 0.35;
            const s = front ? 0.58 : 0.42;
            r.electron.scale.set(s, s, 1);
            r.mat.opacity = (root.classList.contains('dark') ? 0.5 : 0.62) * (hot ? 1.35 : 1);
        });

        const pulse = 1 + 0.03 * Math.sin(t * 2.4);
        nucleus.scale.set(2.05 * pulse, 2.05 * pulse, 1);
        halo.material.opacity = (root.classList.contains('dark') ? 0.22 : 0.1) * (0.75 + 0.4 * Math.sin(t * 2.4)) * (hot ? 1.6 : 1);

        renderer.render(scene, camera);
    };

    const loop = () => { frame(); rafId = requestAnimationFrame(loop); };
    const play = () => {
        cancelAnimationFrame(rafId);
        if (REDUCED_MOTION) { frame(); return; }
        if (visible && !document.hidden) rafId = requestAnimationFrame(loop);
    };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((e) => { visible = e[0].isIntersecting; play(); }, { threshold: 0.05 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', play);
    window.addEventListener('resize', () => { resize(); if (REDUCED_MOTION) frame(); });
    document.addEventListener('aint:theme', () => { applyTheme(); if (REDUCED_MOTION) frame(); });

    // WebGL is live — drop the static "M·S" fallback
    const fb = canvas.parentElement.querySelector('.brand-fallback');
    if (fb) fb.style.display = 'none';

    play();
}

initAppliedIntelligence();
initAboutCycle();
initBrandLogo();

/* ============================================================
   "Wow" interactions
   - a scroll-progress bar pinned to the top of the viewport
   - cursor-tracking spotlight + subtle 3D tilt on research cards
     (fine pointer + motion-OK only; touch/reduced-motion skip it)
   ============================================================ */
(() => {
    // Scroll progress
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let ticking = false;
    const updateProgress = () => {
        const st = window.scrollY || document.documentElement.scrollTop || 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(st / max, 1) : 0) + ')';
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();

    // Spotlight + tilt — only where it feels good (mouse/trackpad, motion allowed)
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || REDUCED_MOTION) return;

    document.querySelectorAll('.research-item').forEach((card) => {
        let raf = 0, ev = null;
        const apply = () => {
            raf = 0;
            const r = card.getBoundingClientRect();
            const px = (ev.clientX - r.left) / r.width;
            const py = (ev.clientY - r.top) / r.height;
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            card.style.setProperty('--ry', ((px - 0.5) * 7).toFixed(2) + 'deg');
            card.style.setProperty('--rx', (-(py - 0.5) * 7).toFixed(2) + 'deg');
        };
        card.addEventListener('pointermove', (e) => {
            ev = e;
            if (!raf) raf = requestAnimationFrame(apply);
        });
        card.addEventListener('pointerleave', () => {
            if (raf) { cancelAnimationFrame(raf); raf = 0; }
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });
})();

/* ---------- Language switcher dropdown ---------- */
(() => {
    const trigger = document.querySelector('.js-lang-trigger');
    const menu = document.getElementById('lang-menu');
    if (!trigger || !menu) return;
    const wrap = trigger.closest('.lang-switch');
    const close = () => { menu.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); };
    const open = () => { menu.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); };
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    menu.querySelectorAll('a[hreflang]').forEach((link) => {
        link.addEventListener('click', () => {
            localStorage.setItem('language', link.getAttribute('hreflang'));
        });
    });
})();
