import type { PaperShaderElement } from "@paper-design/shaders";

// Folia src/utils/paperShaderUniforms.ts (cbc97c30, fcb95450).
type PaperShaderMount = NonNullable<PaperShaderElement["paperShaderMount"]>;
export type PaperShaderUniforms = Parameters<PaperShaderMount["setUniforms"]>[0];

/**
 * Pushes audio-driven uniforms to a running shader without drawing it. `setUniforms` renders the
 * whole full-screen shader on the spot and re-arms the shader's own frame loop, which then draws
 * it again on the next frame - two full passes per shader per frame. While the shader animates,
 * its loop picks the new values up on its next draw; a stopped shader (speed 0) has no loop, so
 * it still gets the immediate draw. `setUniformValues` is the mount's own uniform writer, private
 * only in its typings; if a future version drops it, this falls back to `setUniforms`.
 */
export const updatePaperShaderUniforms = (
  mount: Pick<PaperShaderMount, "setUniforms">,
  uniforms: PaperShaderUniforms,
  animating: boolean,
) => {
  const writer = (mount as unknown as { setUniformValues?: (values: PaperShaderUniforms) => void })
    .setUniformValues;
  if (animating && typeof writer === "function") {
    writer(uniforms);
    return;
  }
  mount.setUniforms(uniforms);
};
