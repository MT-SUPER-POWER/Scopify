// Folia `src/components/visualizer/loadPixi.ts` (2bd643a8): the single place Folia stage
// renderers and Lattice pull Pixi in, so the shader precision default is raised and the filter
// pool shim (pixiFilterPoolCompat.ts) is installed before the first program is compiled.
//
// Pixi injects `precision mediump float;` into every fragment shader that does not declare its
// own. On Windows and Intel/Mesa that is already fp32, but the NVIDIA Linux driver reached
// through ANGLE treats mediump as real fp16. Pixi's NoiseFilter - the grain pass in Sonnet's and
// Tempera's post-process chains - hashes `gl_FragCoord.xy * uSeed`; past roughly
// `65504 / uSeed` that overflows to Inf, `sin(Inf)` is NaN, and every pixel beyond a straight
// line is written black. highp is fp32 on every device Pixi 8 runs on (WebGL2/WebGPU only), and
// Pixi still falls back to mediump where highp is unavailable. Shaders that declare their own
// precision line are left alone.
import { installPixiFilterPoolCompat } from "./pixiFilterPoolCompat";

type PixiModule = typeof import("pixi.js");

let pending: Promise<PixiModule> | null = null;

/**
 * Must be awaited before any renderer, filter or shader is constructed: `GlProgram.from` caches
 * compiled sources, so a program built before the flip would keep its mediump variant.
 */
export const loadPixi = (): Promise<PixiModule> =>
  (pending ??= import("pixi.js").then(
    (pixi) => {
      pixi.GlProgram.defaultOptions.preferredFragmentPrecision = "highp";
      installPixiFilterPoolCompat(pixi);
      return pixi;
    },
    (error: unknown) => {
      pending = null;
      throw error;
    },
  ));
