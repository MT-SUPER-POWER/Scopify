import { describe, expect, it } from "bun:test";
import {
  destroyPixiContainerChildren,
  destroyPixiDisplayTree,
  unloadPixiDisplayTree,
  type PixiDisplayNode,
} from "@/components/lyrics/folia/src/components/visualizer/pixiDisplayResources";
import { createPaperShaderReleaseRef } from "@/lib/lyrics/folia/paperShaderContext";
import { latticeLyricResolution } from "@/lib/playlist/lattice/lyrics/createLatticeLyricRuntime";

// Folia P0 同步修复测试：Pixi 显示树释放、Lattice 整数分辨率、Latent 着色器上下文释放
const node = (name: string, log: string[], children: PixiDisplayNode[] = []) => ({
  children,
  context: { unload: () => log.push(`context:${name}`) },
  destroy: (...args: unknown[]) => log.push(`destroy:${name}:${args.length}`),
  unload: () => log.push(`unload:${name}`),
});

describe("Pixi display tree release", () => {
  it("destroys children before parents without forwarding options", () => {
    const log: string[] = [];
    const tree = node("root", log, [node("a", log, [node("a1", log)]), node("b", log)]);
    destroyPixiDisplayTree(tree);
    const destroys = log.filter((entry) => entry.startsWith("destroy:"));
    expect(destroys).toHaveLength(4);
    expect(destroys.every((entry) => entry.endsWith(":0"))).toBe(true);
    expect(destroys.indexOf("destroy:a1:0")).toBeLessThan(destroys.indexOf("destroy:a:0"));
    expect(destroys.at(-1)).toBe("destroy:root:0");
  });

  it("unloads each Graphics context along with the node", () => {
    const log: string[] = [];
    unloadPixiDisplayTree(node("root", log, [node("child", log)]));
    expect(log).toEqual(["context:child", "unload:child"]);
  });

  it("destroys every detached child subtree", () => {
    const log: string[] = [];
    const children = [node("a", log, [node("a1", log)]), node("b", log)];
    destroyPixiContainerChildren({ removeChildren: () => children });
    expect(log).toEqual(["destroy:a1:0", "destroy:a:0", "destroy:b:0"]);
  });
});

describe("Lattice lyric resolution", () => {
  it("rounds fractional scaling up to a whole number capped at 2", () => {
    expect(latticeLyricResolution(1)).toBe(1);
    expect(latticeLyricResolution(1.25)).toBe(2);
    expect(latticeLyricResolution(1.5)).toBe(2);
    expect(latticeLyricResolution(3)).toBe(2);
    expect(latticeLyricResolution(0.75)).toBe(1);
    expect(latticeLyricResolution(Number.NaN)).toBe(1);
  });
});

describe("Paper shader release ref", () => {
  const shaderWith = (isConnected: boolean) => {
    let lost = false;
    const gl = {
      getExtension: () => ({ loseContext: () => (lost = true) }),
      isContextLost: () => lost,
    };
    const canvas = { getContext: () => gl, isConnected };
    const element = { paperShaderMount: { canvasElement: canvas } };
    return { element, isLost: () => lost };
  };

  it("loses the WebGL context once the canvas has left the document", async () => {
    const target = { current: null };
    const shader = shaderWith(false);
    const cleanup = createPaperShaderReleaseRef(target)(shader.element as never);
    expect(target.current).toBe(shader.element as never);
    cleanup?.();
    await Promise.resolve();
    expect(target.current).toBeNull();
    expect(shader.isLost()).toBe(true);
  });

  it("keeps the context of a canvas that is still attached", async () => {
    const shader = shaderWith(true);
    createPaperShaderReleaseRef({ current: null })(shader.element as never)?.();
    await Promise.resolve();
    expect(shader.isLost()).toBe(false);
  });
});
