/* Micro-interactions (DOM/CSS only, no WebGL): magnetic buttons, a custom
   dot+ring cursor, the preloader monogram, and the footer icon lift-in.
   All are fine-pointer / motion-OK guarded and self-remove cleanly, so touch
   and reduced-motion visitors get the plain page. */

import { FINE_POINTER, REDUCED_MOTION } from './env.js';

/* Magnetic pull toward the cursor on buttons/toggles. */
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
            el.style.transform = `translate(${(mx * k).toFixed(1)}px, ${(my * k).toFixed(1)}px)`;
        };
        el.addEventListener('pointermove', (e) => { ev = e; if (!raf) raf = requestAnimationFrame(move); });
        el.addEventListener('pointerleave', () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } el.style.transform = ''; });
    });
};

/* Custom cursor: a solid dot that tracks 1:1 and a ring that trails and grows
   over interactive elements. Native cursor is hidden only while this is active;
   first touch tears it all down so touch users keep the system cursor. */
export const customCursor = () => {
    if (!FINE_POINTER || REDUCED_MOTION) return;
    const dot = document.createElement('div'); dot.className = 'fx-cursor-dot';
    const ring = document.createElement('div'); ring.className = 'fx-cursor-ring';
    [dot, ring].forEach((e) => { e.setAttribute('aria-hidden', 'true'); document.body.appendChild(e); });
    const root = document.documentElement;
    root.classList.add('fx-cursor-on');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my, raf = 0, alive = true;
    window.addEventListener('pointermove', (e) => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
    const loop = () => {
        rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        if (alive) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const INTER = 'a, button, [role="menuitem"], .research-item, .stat, .lang-trigger, .js-change-theme';
    document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest(INTER)) root.classList.add('fx-cursor-hot'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest(INTER)) root.classList.remove('fx-cursor-hot'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { alive = false; cancelAnimationFrame(raf); } else if (!alive) { alive = true; raf = requestAnimationFrame(loop); } });

    window.addEventListener('touchstart', () => {
        alive = false; cancelAnimationFrame(raf);
        root.classList.remove('fx-cursor-on', 'fx-cursor-hot');
        dot.remove(); ring.remove();
    }, { once: true, passive: true });
};

/* Preloader: the "M·S" overlay is injected by the inline <head> gate before
   first paint (so there's no content flash and a longstop always clears it).
   Here we just hide it as soon as the page has loaded — earlier than the
   gate's longstop — so it never blocks longer than the load actually takes. */
export const preloader = () => {
    const ov = document.querySelector('.fx-preloader');
    if (!ov) return;
    let done = false;
    const finish = () => {
        if (done) return; done = true;
        ov.classList.add('fx-pre-out');
        setTimeout(() => ov.remove(), 700);
    };
    if (document.readyState === 'complete') setTimeout(finish, 300);
    else window.addEventListener('load', () => setTimeout(finish, 300), { once: true });
    setTimeout(finish, 1800);
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
