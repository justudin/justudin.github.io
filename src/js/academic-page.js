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
        const response = await axios.get('https://aintlab.com/updates/rss.xml');
        const rssdataxml = response.data;
        const updatedata = fromXML(rssdataxml);
        const recentupdates = updatedata.rss.channel.item.slice(0, 4);

        let updates = recentupdates.map(item =>
            `<a href='${item.link}' target='_blank' class='link' data-tippy-content='View this update'>${item.title}</a>`
        ).join(', ');

        updates += `, <a href='https://aintlab.com/updates' class='link' data-tippy-content='View all updates' target='_blank'>All updates</a>`;
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
   Applied Intelligence — three.js neural network hero
   three.min.js is lazy-loaded so the initial paint stays fast;
   if WebGL or the script fails, the hero quietly falls back to
   the CSS gradient background.
   ============================================================ */
const initAppliedIntelligence = () => {
    const canvas = document.getElementById('aintel-canvas');
    if (!canvas || !window.WebGLRenderingContext) return;

    const script = document.createElement('script');
    script.src = 'js/three.min.js';
    script.async = true;
    script.onload = () => {
        try { buildAintelScene(canvas); }
        catch (e) { console.error(e); canvas.style.display = 'none'; }
    };
    script.onerror = () => { canvas.style.display = 'none'; };
    document.head.appendChild(script);
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
    const LAYERS = small ? [4, 6, 6, 3] : [5, 8, 8, 4];
    const LAYER_X = small ? [-10, -3.5, 3.5, 10] : [-16, -5.5, 5.5, 16];
    const SPREAD = small ? 6 : 8.5;
    const SIGNAL_COUNT = small ? 14 : 26;
    const DUST_COUNT = small ? 70 : 150;

    /* --- network nodes --- */
    const nodePos = [];
    const layerOf = [];
    LAYERS.forEach((count, li) => {
        for (let i = 0; i < count; i++) {
            const y = (count === 1 ? 0 : (i / (count - 1) - 0.5) * 2 * SPREAD) + (Math.random() - 0.5) * 1.6;
            const z = (Math.random() - 0.5) * 7;
            nodePos.push(LAYER_X[li] + (Math.random() - 0.5) * 1.2, y, z);
            layerOf.push(li);
        }
    });
    const nodeCount = nodePos.length / 3;

    /* --- edges: each node feeds 2 random nodes in the next layer --- */
    const edges = [];
    let offset = 0;
    for (let li = 0; li < LAYERS.length - 1; li++) {
        const nextOffset = offset + LAYERS[li];
        for (let i = 0; i < LAYERS[li]; i++) {
            const picked = new Set();
            const links = 2 + (Math.random() < 0.35 ? 1 : 0);
            while (picked.size < Math.min(links, LAYERS[li + 1])) {
                picked.add(nextOffset + Math.floor(Math.random() * LAYERS[li + 1]));
            }
            picked.forEach((target) => edges.push([offset + i, target]));
        }
        offset = nextOffset;
    }

    const group = new THREE.Group();
    scene.add(group);

    /* --- glow-sprite shader shared by nodes / signals / dust --- */
    const makePointsMaterial = (opts) => new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uWave: { value: -999 },
            uPR: { value: renderer.getPixelRatio() },
            uColor: { value: new THREE.Color('#0047BB') },
            uCore: { value: new THREE.Color('#FFFFFF') },
            uOpacity: { value: opts.opacity }
        },
        vertexShader: [
            'uniform float uTime; uniform float uWave; uniform float uPR;',
            'attribute float aSeed; attribute float aSize;',
            'varying float vGlow;',
            'void main() {',
            '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
            '  float pulse = 0.85 + 0.25 * sin(uTime * 1.7 + aSeed * 6.2831);',
            '  float wave = smoothstep(4.5, 0.0, abs(position.x - uWave));',
            '  vGlow = wave;',
            '  gl_PointSize = aSize * uPR * pulse * (1.0 + wave * 0.9) * (140.0 / -mv.z);',
            '  gl_Position = projectionMatrix * mv;',
            '}'
        ].join('\n'),
        fragmentShader: [
            'uniform vec3 uColor; uniform vec3 uCore; uniform float uOpacity;',
            'varying float vGlow;',
            'void main() {',
            '  float d = distance(gl_PointCoord, vec2(0.5));',
            '  float alpha = smoothstep(0.5, 0.12, d);',
            '  float core = smoothstep(0.22, 0.0, d);',
            '  vec3 col = mix(uColor, uCore, core * 0.75 + vGlow * 0.2);',
            '  gl_FragColor = vec4(col, alpha * uOpacity * (0.75 + vGlow * 0.25));',
            '  if (gl_FragColor.a < 0.01) discard;',
            '}'
        ].join('\n'),
        transparent: true,
        depthWrite: false
    });

    const buildPoints = (positions, sizeMin, sizeMax, opacity) => {
        const geo = new THREE.BufferGeometry();
        const n = positions.length / 3;
        const seeds = new Float32Array(n);
        const sizes = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            seeds[i] = Math.random();
            sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        const mat = makePointsMaterial({ opacity });
        return new THREE.Points(geo, mat);
    };

    const nodes = buildPoints(nodePos, 1.7, 2.5, 0.95);
    group.add(nodes);

    /* --- connections --- */
    const linePositions = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
        linePositions[i * 6] = nodePos[a * 3];
        linePositions[i * 6 + 1] = nodePos[a * 3 + 1];
        linePositions[i * 6 + 2] = nodePos[a * 3 + 2];
        linePositions[i * 6 + 3] = nodePos[b * 3];
        linePositions[i * 6 + 4] = nodePos[b * 3 + 1];
        linePositions[i * 6 + 5] = nodePos[b * 3 + 2];
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.25, depthWrite: false });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    /* --- signals travelling along edges --- */
    const signalState = [];
    const signalPos = new Float32Array(SIGNAL_COUNT * 3);
    for (let i = 0; i < SIGNAL_COUNT; i++) {
        signalState.push({
            edge: Math.floor(Math.random() * edges.length),
            t: Math.random(),
            speed: 0.25 + Math.random() * 0.5
        });
    }
    const signals = buildPoints(signalPos, 0.9, 1.2, 1.0);
    signals.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
    group.add(signals);

    /* --- ambient dust --- */
    const dustPos = [];
    for (let i = 0; i < DUST_COUNT; i++) {
        dustPos.push((Math.random() - 0.5) * 64, (Math.random() - 0.5) * 34, (Math.random() - 0.5) * 24 - 4);
    }
    const dust = buildPoints(dustPos, 0.5, 0.95, 0.4);
    scene.add(dust);

    /* --- theme-aware palette --- */
    const applyTheme = () => {
        const dark = root.classList.contains('dark');
        const nodeColor = cssVarColor('--scene-node', '#0047BB');
        const lineColor = cssVarColor('--scene-line', '#3F7AD6');
        const signalColor = cssVarColor('--scene-signal', '#0090FF');
        const dustColor = cssVarColor('--scene-dust', '#9FBDEB');
        const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;

        nodes.material.uniforms.uColor.value = nodeColor;
        nodes.material.uniforms.uCore.value = new THREE.Color(dark ? '#FFFFFF' : '#002B70');
        signals.material.uniforms.uColor.value = signalColor;
        signals.material.uniforms.uCore.value = new THREE.Color(dark ? '#FFFFFF' : '#0047BB');
        dust.material.uniforms.uColor.value = dustColor;
        dust.material.uniforms.uCore.value = dustColor;
        lineMat.color = lineColor;
        lineMat.opacity = dark ? 0.28 : 0.3;

        [nodes.material, signals.material, dust.material, lineMat].forEach((m) => {
            m.blending = blending;
            m.needsUpdate = true;
        });
    };
    applyTheme();

    /* --- sizing --- */
    const resize = () => {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const s = Math.max(0.6, Math.min(1, camera.aspect / 1.5));
        group.scale.setScalar(s);
    };
    resize();

    /* --- pointer parallax --- */
    let targetRX = 0, targetRY = 0;
    window.addEventListener('pointermove', (e) => {
        const mx = e.clientX / window.innerWidth - 0.5;
        const my = e.clientY / window.innerHeight - 0.5;
        targetRY = mx * 0.45;
        targetRX = -my * 0.3;
    }, { passive: true });

    /* --- render loop with visibility management --- */
    const clock = new THREE.Clock();
    let rafId = 0;
    let heroVisible = true;

    const renderFrame = () => {
        const t = clock.getElapsedTime();

        // gentle idle drift + pointer parallax
        const driftY = Math.sin(t * 0.09) * 0.07;
        group.rotation.y += (targetRY + driftY - group.rotation.y) * 0.05;
        group.rotation.x += (targetRX - group.rotation.x) * 0.05;
        dust.rotation.y = t * 0.012;

        // pulse wave sweeping input → output
        const wave = -28 + ((t * 10) % 56);
        nodes.material.uniforms.uTime.value = t;
        nodes.material.uniforms.uWave.value = wave;
        signals.material.uniforms.uTime.value = t;
        dust.material.uniforms.uTime.value = t;

        // signals travelling along edges
        const attr = signals.geometry.getAttribute('position');
        for (let i = 0; i < SIGNAL_COUNT; i++) {
            const s = signalState[i];
            s.t += s.speed * 0.016;
            if (s.t >= 1) {
                s.edge = Math.floor(Math.random() * edges.length);
                s.t = 0;
                s.speed = 0.25 + Math.random() * 0.5;
            }
            const [a, b] = edges[s.edge];
            const e = s.t * s.t * (3 - 2 * s.t); // smoothstep easing
            attr.array[i * 3] = nodePos[a * 3] + (nodePos[b * 3] - nodePos[a * 3]) * e;
            attr.array[i * 3 + 1] = nodePos[a * 3 + 1] + (nodePos[b * 3 + 1] - nodePos[a * 3 + 1]) * e;
            attr.array[i * 3 + 2] = nodePos[a * 3 + 2] + (nodePos[b * 3 + 2] - nodePos[a * 3 + 2]) * e;
        }
        attr.needsUpdate = true;

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

initAppliedIntelligence();
