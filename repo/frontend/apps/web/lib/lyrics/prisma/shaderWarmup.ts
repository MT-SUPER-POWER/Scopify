import { PRISMA_CONTEXT_ATTRIBUTES, startPrismaPrograms } from "./gl";

// lib/lyrics/prisma/shaderWarmup.ts
// Compiles 聚散's shaders in an off-screen context ahead of time, so the GPU process has them cached when the
// style first mounts. Compiling happens on the GPU process's own threads; this only checks in now and then.

const POLL_MS = 100;
const GIVE_UP_MS = 30_000;

let started = false;

export const warmPrismaShaders = (): void => {
  if (started || typeof document === "undefined") return;
  started = true;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const gl = canvas.getContext("webgl2", PRISMA_CONTEXT_ATTRIBUTES);
  if (!gl) return;
  const release = () => gl.getExtension("WEBGL_lose_context")?.loseContext();
  const startedAt = performance.now();
  const build = startPrismaPrograms(gl);
  // Without parallel compilation, asking for the result would block the main thread.
  if (!build.parallel) {
    release();
    return;
  }
  const poll = () => {
    if (gl.isContextLost()) return;
    if (build.poll()) {
      console.info(
        `[Prisma] shader warm-up done in ${Math.round(performance.now() - startedAt)} ms`,
      );
      release();
      return;
    }
    if (performance.now() - startedAt > GIVE_UP_MS) {
      release();
      return;
    }
    window.setTimeout(poll, POLL_MS);
  };
  window.setTimeout(poll, POLL_MS);
};
