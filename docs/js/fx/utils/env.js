/* Capability + preference flags for the FX layer.
   The inline <head> gate (html[data-fx="on"]) has already excluded browsers
   without ES-module support, reduced-motion visitors, save-data connections,
   and very low-end devices; these flags cover the finer-grained decisions
   made inside the layer. */

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const SMALL = window.innerWidth < 640;
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

/* Particle budget for the hero field: full 15k only on machines that can
   clearly afford it, 9k mid-tier, 6k on phones. One draw call either way —
   the budget only changes vertex count. */
export const heroParticleBudget = () => {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 8;
    if (SMALL) return 6000;
    if (cores <= 4 || mem <= 4) return 9000;
    return 15000;
};
