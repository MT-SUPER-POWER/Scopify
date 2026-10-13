import { describe, expect, it } from "bun:test";
import * as pixi from "pixi.js";
import { AnimatedGraphics } from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetAnimatedGraphics";

// 商籁 AnimatedGraphics：未出场的笔画不再发给 Pixi，但依赖共享路径的命令照常重放（Folia 68e3360c）
const instructions = (graphics: AnimatedGraphics) => graphics.display.context.instructions;

describe("Sonnet AnimatedGraphics pending commands", () => {
  it("emits nothing for moveTo-led commands that have not started yet", () => {
    const graphics = new AnimatedGraphics(pixi);
    graphics.moveTo(0, 0).lineTo(40, 0).stroke({ color: 0xffffff, width: 2 });
    graphics.moveTo(0, 10).lineTo(40, 10).stroke({ color: 0xffffff, width: 2 });
    graphics.rect(0, 20, 40, 10).fill({ color: 0xffffff, alpha: 0.5 });
    graphics.circle(20, 50, 6).fill({ color: 0xffffff });

    graphics.update(0);
    expect(instructions(graphics)).toHaveLength(0);

    // The second stroke's window opens at ~0.31 and the circle's at ~0.28; both still wait at 0.2.
    graphics.update(0.2);
    expect(instructions(graphics).map((instruction) => instruction.action)).toEqual([
      "stroke",
      "fill",
    ]);

    graphics.update(1);
    expect(instructions(graphics)).toHaveLength(4);
  });

  it("keeps pending commands whose path state reaches an arc-led stroke", () => {
    const graphics = new AnimatedGraphics(pixi);
    graphics.circle(20, 20, 6).fill({ color: 0xffffff });
    graphics.arc(20, 20, 12, 0, Math.PI / 2).stroke({ color: 0xffffff, width: 2 });

    graphics.update(0);
    // The arc-led stroke emits no segment yet, so Pixi strokes the fill's path in its place;
    // skipping either command would change that.
    const emitted = instructions(graphics);
    expect(emitted.map((instruction) => instruction.action)).toEqual(["fill", "stroke"]);
    const pathOf = (index: number) => (emitted[index].data as { path: pixi.GraphicsPath }).path;
    expect(pathOf(1)).toBe(pathOf(0));
  });

  it("does not redraw while the clamped progress is unchanged", () => {
    const graphics = new AnimatedGraphics(pixi);
    graphics.moveTo(0, 0).lineTo(40, 0).stroke({ color: 0xffffff, width: 2 });
    graphics.update(1);
    const drawn = instructions(graphics)[0];
    graphics.update(1.5);
    expect(instructions(graphics)[0]).toBe(drawn);
  });
});
