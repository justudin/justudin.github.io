/* Bridge between the site's CSS theme system and the WebGL scenes.
   academic-page.js dispatches 'aint:theme' whenever the toggle flips; scenes
   re-read the --scene-* custom properties at that moment so both layers stay
   driven by the same palette in custom.css. */

const root = document.documentElement;

export const isDark = () => root.classList.contains('dark');

export const cssVar = (name, fallback) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback;

export const onTheme = (fn) => document.addEventListener('aint:theme', fn);
