/* FX layer entry — active only when the inline <head> gate set
   html[data-fx="on"] (ES modules + WebGL-capable, no reduced-motion, no
   save-data, not low-end). academic-page.js skips its own hero scene when
   the gate is on, so exactly one scene ever owns #aintel-canvas; the About
   cycle and nav emblem stay in academic-page.js until the shared-renderer
   consolidation phase. If anything here fails, the CSS-gradient hero and
   full static content remain untouched underneath. */

import { loadThree } from './utils/three-loader.js';
import { buildHeroScene } from './scenes/hero.js';
import { buildCards } from './scenes/cards.js';
import { revealHero, statAccents } from './utils/reveal.js';
import { initScroll } from './utils/scroll.js';
import { magnetic, customCursor, preloader, footerLift } from './utils/microux.js';

const boot = () => {
    if (document.documentElement.dataset.fx !== 'on') return;

    preloader();
    revealHero();
    statAccents();
    magnetic();
    customCursor();
    footerLift();

    const canvas = document.getElementById('aintel-canvas');
    if (!canvas || !window.WebGLRenderingContext) return;
    loadThree().then(() => {
        let handle = null;
        try { handle = buildHeroScene(canvas); }
        catch (e) { console.error(e); canvas.style.display = 'none'; }
        // research pillar micro-scenes (shared scissor-test renderer)
        try { buildCards(); }
        catch (e) { console.error('cards layer disabled:', e); }
        // smooth-scroll + scroll-morph; on any failure the page keeps native
        // scrolling and the hero scene simply animates in place.
        if (handle) initScroll(handle).catch((e) => console.error('scroll layer disabled:', e));
    }).catch((e) => { console.error(e); });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
