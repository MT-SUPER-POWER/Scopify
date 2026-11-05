import * as THREE from "three";

// lib/lyrics/rhine/programWarmup.ts
// Rhine's shader programs, compiled in the background instead of inside the first frames.
// three.js builds a program the first time something is drawn with it, and each build waits for the driver to
// link it: with a few dozen physical-material variants that was one main-thread task of several seconds
// (measured in the desktop app: the first warm-up paint took 3.5 s). With KHR_parallel_shader_compile the
// programs are handed to the GPU process at once and the main thread only asks now and then whether they are
// done (`waitForPrograms`); without the extension three reports every program as ready and the first draw
// compiles synchronously, as before.
// The pattern follows the Machi renderer's `programWarmup.ts` in the vendored Folia source.

/** How often to ask whether the programs are done. */
const POLL_MS = 12;
/** Longest wait (a stuck driver, say): after this the first draw compiles whatever is left. */
const GIVE_UP_MS = 15_000;

/** Lets other tasks (animations, input) run before the next heavy step. */
export const yieldToMain = (): Promise<void> => {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (typeof scheduler?.yield === "function") return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
};

interface ThreeProgram {
  isReady: () => boolean;
}

/** The renderer's programs (three's WebGLProgram, typed as the DOM's WebGLProgram). */
const programsOf = (renderer: THREE.WebGLRenderer) =>
  (renderer.info.programs ?? []) as unknown as ThreeProgram[];

/**
 * Hands every program the scene needs to the driver, in the variants the frame will really use, without waiting.
 * - Programs differ by the render target they draw into (linear output, no tone mapping), so this compiles
 *   with the composer's own buffer set.
 * - `renderer.compile` only splits a double-sided material into back and front programs when it is
 *   `transparent`; a transmissive one is drawn that way too (three's transmission pass), so the two sides
 *   are compiled here by hand. Without this the first real frame builds them synchronously.
 */
export function submitSceneCompile(
  renderer: THREE.WebGLRenderer,
  target: THREE.WebGLRenderTarget | null,
  scene: THREE.Scene,
  camera: THREE.Camera,
) {
  const transmissive = new Set<THREE.MeshPhysicalMaterial>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (
        material instanceof THREE.MeshPhysicalMaterial &&
        material.transmission > 0 &&
        material.side === THREE.DoubleSide &&
        !material.forceSinglePass
      ) {
        transmissive.add(material);
      }
    }
  });
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  try {
    renderer.compile(scene, camera);
    for (const side of [THREE.BackSide, THREE.FrontSide]) {
      for (const material of transmissive) {
        material.side = side;
        material.needsUpdate = true;
      }
      renderer.compile(scene, camera);
    }
  } finally {
    for (const material of transmissive) {
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    }
    renderer.setRenderTarget(previous);
  }
}

/** Resolves when every program in the renderer is ready (or on timeout); rejects when aborted. */
export const waitForPrograms = (
  renderer: THREE.WebGLRenderer,
  signal?: AbortSignal,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const check = () => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      // isReady asks through the parallel-compile extension and does not block.
      if (programsOf(renderer).every((program) => program.isReady())) {
        resolve();
        return;
      }
      if (performance.now() - startedAt > GIVE_UP_MS) {
        console.warn(
          `[RhineBackground] shader programs still compiling after ${GIVE_UP_MS} ms, drawing anyway`,
        );
        resolve();
        return;
      }
      setTimeout(check, POLL_MS);
    };
    check();
  });
