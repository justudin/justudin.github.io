/* Full-viewport noise "wipe" drawn on the shared overlay canvas.
   A barely-there animated grain gives the FX page a cohesive filmic texture;
   when a new section scrolls into view a brighter noisy band sweeps down it
   (uWipe 0→1), reading as a subtle shader transition. Kept deliberately low
   contrast so it never fights the content — tune uOpacity to taste. */

export const noiseVert = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);   // fullscreen clip-space quad
}
`;

export const noiseFrag = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uWipe;      // 1 = idle, <1 = a band sweeping down
uniform float uOpacity;   // base grain strength
uniform vec3  uColor;
uniform float uAspect;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
    vec2 uv = vec2(vUv.x * uAspect, vUv.y);
    float n = vnoise(uv * 190.0 + uTime * 1.5);         // fine grain
    n = mix(n, vnoise(uv * 42.0 - uTime * 0.4), 0.4);   // + slow drift

    float grain = (n - 0.5) * uOpacity;

    // sweeping band during a wipe (uWipe animates 0→1 top→bottom)
    float band = 0.0;
    if (uWipe < 1.0) {
        float d = abs((1.0 - vUv.y) - uWipe);
        band = smoothstep(0.16, 0.0, d) * n * 0.5 * (1.0 - uWipe);
    }

    float a = clamp(grain + band, 0.0, 1.0);
    gl_FragColor = vec4(uColor, a);
    if (gl_FragColor.a < 0.004) discard;
}
`;
