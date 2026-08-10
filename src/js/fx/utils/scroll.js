/* Smooth-scroll + scroll-morph layer.
   Lazy-loads GSAP + ScrollTrigger + Lenis (vendored UMD globals) only when the
   FX gate is on, then:
     - drives Lenis smooth scrolling, integrated with GSAP's ticker + ScrollTrigger
     - pins the hero for one extra viewport and scrubs the hero scene's morph
       (globe → portrait → dispersed stream) via the handle from buildHeroScene
     - fades the hero copy out as the morph progresses
   Everything is guarded: if any library fails to load, we reject and main.js
   leaves native scrolling and the static hero exactly as they were. */

import { REDUCED_MOTION, SMALL } from './env.js';

const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.addEventListener('load', resolve);
    s.addEventListener('error', () => reject(new Error('failed to load ' + src)));
    document.head.appendChild(s);
});

let libsPromise = null;
const loadLibs = () => {
    if (libsPromise) return libsPromise;
    // GSAP must be present before ScrollTrigger registers; Lenis is independent.
    libsPromise = loadScript('js/fx/vendor/gsap.min.js')
        .then(() => Promise.all([
            loadScript('js/fx/vendor/ScrollTrigger.min.js'),
            loadScript('js/fx/vendor/lenis.min.js')
        ]))
        .then(() => {
            if (!window.gsap || !window.ScrollTrigger || !window.Lenis) {
                throw new Error('scroll libs loaded but a global is missing');
            }
        });
    return libsPromise;
};

export const initScroll = (heroHandle) => {
    if (REDUCED_MOTION) return Promise.resolve(null);
    return loadLibs().then(() => {
        const { gsap, ScrollTrigger, Lenis } = window;
        gsap.registerPlugin(ScrollTrigger);

        /* ---- Lenis smooth scroll, driven by GSAP's ticker ---- */
        const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        /* Internal anchor links should use Lenis so the smooth scroll is
           honoured — including the skip link, since a native anchor jump would
           just be overridden by Lenis's own rAF loop. preventDefault() here
           swallows the browser's native "move focus to the target" behaviour,
           which is the entire point of a skip link, so focus is moved
           explicitly on completion; that also stops keyboard users being
           scrolled somewhere their tab position hasn't followed. [data-no-lenis]
           is the escape hatch for any anchor that must keep native behaviour.
           The nav is not sticky, so no offset is needed. */
        document.querySelectorAll('a[href^="#"]:not([data-no-lenis])').forEach((a) => {
            a.addEventListener('click', (e) => {
                const id = a.getAttribute('href');
                if (id.length < 2) return;
                const el = document.querySelector(id);
                if (!el) return;
                e.preventDefault();
                lenis.scrollTo(el, {
                    offset: 0,
                    onComplete: () => {
                        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
                        el.focus({ preventScroll: true });
                    }
                });
            });
        });

        /* ---- hero pin + morph scrub ---- */
        const hero = document.querySelector('.hero');
        const inner = document.querySelector('.hero-inner');
        const cue = document.querySelector('.scroll-cue');
        if (hero && heroHandle && typeof heroHandle.setScroll === 'function') {
            heroHandle.setScroll(0);
            ScrollTrigger.create({
                trigger: hero,
                start: 'top top',
                /* Was 1.25 viewports (1.0 on phones) — that meant the first
                   full screen-and-a-quarter of scrolling produced no page
                   movement at all before the first section appeared. Halved:
                   the morph still reads, but visitors reach the content. */
                end: '+=' + Math.round(window.innerHeight * (SMALL ? 0.45 : 0.6)),
                pin: true,
                pinSpacing: true,
                scrub: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const p = self.progress;
                    heroHandle.setScroll(p);
                    if (inner) {
                        const f = Math.min(p / 0.5, 1);
                        inner.style.opacity = String(1 - f);
                        inner.style.transform = 'translateY(' + (-f * 48) + 'px)';
                    }
                    if (cue) cue.style.setProperty('opacity', String(Math.max(0, 1 - p * 6)), 'important');
                }
            });
        }

        ScrollTrigger.refresh();
        return { lenis, ScrollTrigger };
    });
};
