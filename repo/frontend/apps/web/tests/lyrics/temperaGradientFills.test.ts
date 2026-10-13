import { describe, expect, it } from "bun:test";
import * as pixi from "pixi.js";
import { destroyTemperaGradientFills } from "@/components/lyrics/folia/src/components/visualizer/tempera/temperaShapes";

// 凝彩渐变填充随显示树释放（Folia ef523089）。FillGradient 需要 DOM canvas，
// 这里用原型相同的替身挂到真实 Graphics 的指令上
const fakeGradient = () => {
  const gradient = Object.create(pixi.FillGradient.prototype) as pixi.FillGradient & {
    destroyed: number;
  };
  gradient.destroyed = 0;
  gradient.destroy = () => {
    gradient.destroyed += 1;
  };
  return gradient;
};

const shapeWith = (fill: unknown, action: "fill" | "stroke" = "fill") => {
  const graphics = new pixi.Graphics();
  graphics.context.instructions.push({ action, data: { style: { fill } } } as never);
  return graphics;
};

describe("destroyTemperaGradientFills", () => {
  it("destroys each gradient a tree draws with exactly once", () => {
    const shared = fakeGradient();
    const strokeOnly = fakeGradient();
    const root = new pixi.Container();
    const group = root.addChild(new pixi.Container());
    group.addChild(shapeWith(shared));
    group.addChild(shapeWith(shared));
    root.addChild(shapeWith(strokeOnly, "stroke"));
    root.addChild(shapeWith(0xffffff));

    destroyTemperaGradientFills(pixi, root);
    expect(shared.destroyed).toBe(1);
    expect(strokeOnly.destroyed).toBe(1);
  });
});
