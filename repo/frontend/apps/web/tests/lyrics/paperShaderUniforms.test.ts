import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { updatePaperShaderUniforms } from "@/lib/lyrics/folia/paperShaderUniforms";

// Latent 音频 uniform 写入：运行中只写值不立即绘制，停止时立即绘制；并守住依赖的私有 API（Folia cbc97c30、fcb95450）
const mountWith = (withWriter: boolean) => {
  const calls: string[] = [];
  const mount = {
    setUniforms: () => calls.push("setUniforms"),
    ...(withWriter ? { setUniformValues: () => calls.push("setUniformValues") } : {}),
  };
  return { calls, mount };
};

describe("updatePaperShaderUniforms", () => {
  it("only writes uniforms while the shader's own loop is running", () => {
    const { calls, mount } = mountWith(true);
    updatePaperShaderUniforms(mount as never, { u_swirl: 1 }, true);
    expect(calls).toEqual(["setUniformValues"]);
  });

  it("draws immediately when the shader is stopped", () => {
    const { calls, mount } = mountWith(true);
    updatePaperShaderUniforms(mount as never, { u_swirl: 1 }, false);
    expect(calls).toEqual(["setUniforms"]);
  });

  it("falls back to setUniforms when the private writer is missing", () => {
    const { calls, mount } = mountWith(false);
    updatePaperShaderUniforms(mount as never, { u_swirl: 1 }, true);
    expect(calls).toEqual(["setUniforms"]);
  });

  it("still finds setUniformValues in the installed paper-shaders", () => {
    // The writer is private in the typings; an upgrade that drops it should fail here first.
    // Resolve paper-shaders the way shaders-react does, so the checked copy is the one in use.
    const fromWeb = createRequire(import.meta.url);
    const fromReact = createRequire(fromWeb.resolve("@paper-design/shaders-react"));
    const shaderMount = readFileSync(
      fromReact.resolve("@paper-design/shaders").replace(/index\.js$/, "shader-mount.js"),
      "utf8",
    );
    expect(shaderMount).toContain("setUniformValues = (");
  });
});
