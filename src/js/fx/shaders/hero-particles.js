/* GLSL for the combined hero scene ("Applied Intelligence — real-world flow").
   Kept as exported template strings because the site currently builds with
   gulp (no bundler); if the project migrates to Vite these move to .glsl
   files imported with ?raw, unchanged.

   Two point materials share the scene:
   - glow*  — the ViT pipeline sprites (tokens, particles, dust). A pulse
     wave sweeps along x (uWave); uBoost brightens it during an inference
     run so a click visibly "fires" the network.
   - globe* — the real-world data globe. Has a morph channel
     (position ↔ aTarget, scrubbed by uMorph; aTarget holds the scattered
     intro cloud, and the scroll-morph phase re-writes it) and view-space
     pointer repulsion. */

export const glowVert = /* glsl */ `
uniform float uTime;
uniform float uWave;     // x position of the pulse head
uniform float uBoost;    // 0 idle .. 1 during an inference run
uniform float uPR;

attribute float aSeed;
attribute float aSize;
attribute float aMix;

varying float vGlow;
varying float vMix;

void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float pulse = 0.85 + 0.25 * sin(uTime * 1.7 + aSeed * 6.2831);
    float wave = smoothstep(4.5, 0.0, abs(position.x - uWave)) * (0.6 + uBoost);
    vGlow = wave;
    vMix = aMix;
    gl_PointSize = aSize * uPR * pulse * (1.0 + wave * 0.9) * (140.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
}
`;

export const glowFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uColorB;
uniform vec3 uCore;
uniform float uOpacity;

varying float vGlow;
varying float vMix;

void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.12, d);
    float core = smoothstep(0.22, 0.0, d);
    vec3 col = mix(mix(uColor, uColorB, vMix), uCore, core * 0.75 + vGlow * 0.2);
    gl_FragColor = vec4(col, alpha * uOpacity * (0.75 + vGlow * 0.25));
    if (gl_FragColor.a < 0.01) discard;
}
`;

export const globeVert = /* glsl */ `
uniform float uTime;
uniform float uPR;
uniform float uIntro;          // 1 = scattered cloud, 0 = assembled globe (load intro)
uniform float uSeg1;           // 0 = globe, 1 = portrait silhouette (scroll morph A)
uniform float uSeg2;           // 0 = portrait, 1 = dispersed data stream (scroll morph B)
uniform vec3  uPointer;        // view-space pointer on the globe's plane
uniform float uPointerHeat;    // 0..1, eased in JS; scales the repulsion

attribute vec3  aScatter;      // intro start + stream-dispersal end (reused)
attribute vec3  aPortrait;     // point-cloud portrait sampled from the photo
attribute float aSeed;
attribute float aSize;
attribute float aMix;

varying float vMix;
varying float vTwinkle;

void main() {
    // load intro: scattered cloud condenses into the globe (uIntro 1 → 0)
    vec3 base = mix(position, aScatter, uIntro);
    // scroll morph: globe → portrait → disperse
    vec3 p = mix(base, aPortrait, uSeg1);
    p = mix(p, aScatter, uSeg2);

    // slow radial breathing so the field feels alive even when idle
    p *= 1.0 + 0.015 * sin(uTime * 0.6 + aSeed * 6.2831);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // gentle repulsion around the cursor/touch point, computed in view space
    // so it tracks the pointer regardless of the globe's rotation
    vec2 d = mv.xy - uPointer.xy;
    float dist = length(d);
    float push = smoothstep(3.6, 0.0, dist) * uPointerHeat;
    mv.xy += normalize(d + vec2(1e-4)) * push * 1.4;

    float pulse = 0.8 + 0.3 * sin(uTime * 1.4 + aSeed * 6.2831);
    vTwinkle = pulse;
    vMix = aMix;

    gl_PointSize = aSize * uPR * pulse * (150.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
}
`;

export const globeFrag = /* glsl */ `
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uCore;
uniform float uOpacity;

varying float vMix;
varying float vTwinkle;

void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.1, d);    // soft circular sprite
    float core = smoothstep(0.18, 0.0, d);    // bright centre
    vec3 col = mix(uColorA, uColorB, vMix);
    col = mix(col, uCore, core * 0.8);
    gl_FragColor = vec4(col, alpha * uOpacity * (0.65 + 0.35 * vTwinkle));
    if (gl_FragColor.a < 0.01) discard;
}
`;
