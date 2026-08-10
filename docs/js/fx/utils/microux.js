/* Micro-interactions (DOM/CSS only, no WebGL): magnetic buttons, a custom
   dot+ring cursor, the preloader monogram, and the footer icon lift-in.
   All are fine-pointer / motion-OK guarded and self-remove cleanly, so touch
   and reduced-motion visitors get the plain page. */

import { FINE_POINTER, REDUCED_MOTION } from './env.js';

/* Magnetic pull toward the cursor on buttons/toggles.
   The offset is published as --fx-tx / --fx-ty custom properties and composed
   into the element's transform by CSS, rather than written straight to
   element.style.transform. An inline transform beat the theme toggle's own
   :hover rule in the cascade, so that micro-interaction never fired while the
   FX layer was on. */
export const magnetic = () => {
    if (!FINE_POINTER || REDUCED_MOTION) return;
    document.querySelectorAll('.lang-trigger, .js-change-theme, .btn, .fx-magnetic').forEach((el) => {
        const k = el.classList.contains('js-change-theme') ? 0.4 : 0.28;
        let raf = 0, ev = null;
        const move = () => {
            raf = 0;
            const r = el.getBoundingClientRect();
            const mx = ev.clientX - (r.left + r.width / 2);
            const my = ev.clientY - (r.top + r.height / 2);
            el.style.setProperty('--fx-tx', (mx * k).toFixed(1) + 'px');
            el.style.setProperty('--fx-ty', (my * k).toFixed(1) + 'px');
        };
        el.addEventListener('pointermove', (e) => { ev = e; if (!raf) raf = requestAnimationFrame(move); });
        el.addEventListener('pointerleave', () => {
            if (raf) { cancelAnimationFrame(raf); raf = 0; }
            el.style.removeProperty('--fx-tx');
            el.style.removeProperty('--fx-ty');
        });
    });
};

/* Cursor accent: a ring that trails the pointer and grows over interactive
   elements. It is purely decorative and sits ON TOP of the native cursor — the
   previous version hid the system cursor globally (`cursor: none !important`),
   which removed the I-beam over body copy, flattened the pointer/text
   affordance distinction, and defeated OS large-cursor and high-contrast-cursor
   accessibility settings. First touch tears it down so touch users are clean. */
export const customCursor = () => {
    if (!FINE_POINTER || REDUCED_MOTION) return;
    const ring = document.createElement('div');
    ring.className = 'fx-cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    const root = document.documentElement;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my, raf = 0, alive = true;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const loop = () => {
        rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        if (alive) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* Track hover depth rather than toggling a boolean class: pointerout fires
       when moving between a target's own descendants, which made the highlight
       flicker on any link containing an <svg> or <span>. */
    const INTER = 'a, button, .research-item, .stat, .lang-trigger, .js-change-theme';
    const hit = (e) => e.target && e.target.closest && e.target.closest(INTER);
    document.addEventListener('pointerover', (e) => { if (hit(e)) root.classList.add('fx-cursor-hot'); });
    document.addEventListener('pointerout', (e) => {
        const from = hit(e);
        if (!from) return;
        // only clear when the pointer actually leaves the interactive element
        const to = e.relatedTarget;
        if (to && to.closest && to.closest(INTER) === from) return;
        root.classList.remove('fx-cursor-hot');
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { alive = false; cancelAnimationFrame(raf); } else if (!alive) { alive = true; raf = requestAnimationFrame(loop); } });

    window.addEventListener('touchstart', () => {
        alive = false; cancelAnimationFrame(raf);
        root.classList.remove('fx-cursor-hot');
        ring.remove();
    }, { once: true, passive: true });
};

/* Preloader: the "M·S" overlay is injected by the inline <head> gate before
   first paint. There is nothing genuinely being preloaded — the content is
   static HTML — so this now clears at the first opportunity rather than
   waiting on `load` (which blocks on the CDN'd DocSearch bundle, remote RSS,
   and every image). It goes at DOMContentLoaded, with a 600ms longstop.
   Anything slower than that was costing LCP for a flourish. */
export const preloader = () => {
    const ov = document.querySelector('.fx-preloader');
    if (!ov) return;
    let done = false;
    const finish = () => {
        if (done) return; done = true;
        ov.classList.add('fx-pre-out');
        setTimeout(() => ov.remove(), 700);
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', finish, { once: true });
    } else {
        finish();
    }
    setTimeout(finish, 600);
};

/* Footer social icons lift in with a soft stagger when scrolled into view. */
export const footerLift = () => {
    if (REDUCED_MOTION) return;
    const links = Array.from(document.querySelectorAll('footer a[aria-label]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    links.forEach((a, i) => { a.classList.add('fx-lift'); a.style.setProperty('--fx-ld', (i * 90) + 'ms'); });
    const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('fx-lift-in'); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    links.forEach((a) => io.observe(a));
};
