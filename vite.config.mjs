/* Opt-in bundler for the FX enhancement layer (src/js/fx).
 *
 * The default shipping build is still gulp (`npm run build`) — it copies the
 * FX layer as native ES modules, which works everywhere and keeps the
 * gulp → docs/ → gh-pages deploy exactly as it was. This Vite config is an
 * optional optimisation that bundles + minifies the whole FX module graph
 * (main.js and its static imports) into a single minified `docs/js/fx/main.js`,
 * IN PLACE. Because the output is still an ES module at the same path, the
 * `<script type="module" src="js/fx/main.js">` tag in the HTML does not change,
 * and rollback is simply re-running `npm run build` (gulp).
 *
 * Adopt it with:
 *     npm i -D vite
 *     npm run build:prod      # gulp, then this bundle overwrites main.js
 *
 * The vendored libraries (three, gsap, ScrollTrigger, lenis) are injected at
 * runtime via <script> tags, not imported, so Vite leaves them alone; gulp
 * still copies them into docs/js/… and docs/js/fx/vendor/.
 */
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'docs/js/fx',
        emptyOutDir: false,          // must not wipe the gulp-copied vendor/ + sub-modules
        target: 'es2019',
        minify: 'esbuild',
        rollupOptions: {
            input: 'src/js/fx/main.js',
            output: {
                entryFileNames: 'main.js',
                format: 'es',
                inlineDynamicImports: true
            }
        }
    }
});
