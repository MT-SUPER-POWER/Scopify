import { describe, expect, it } from "bun:test";
import baseline from "./fixtures/colorMixBaseline.json";
import {
  colorWithAlpha,
  mixColors,
  parseColorChannels,
} from "@/components/lyrics/folia/src/components/visualizer/colorMix";

// 颜色解析缓存（Folia 5dfc0105）：输出须与缓存前的实现逐项一致，fixture 由改动前的版本生成
describe("colorMix with parsed-colour cache", () => {
  it("matches the pre-cache outputs for every recorded input", () => {
    for (const row of baseline) {
      // Run twice so the second call is served from the cache.
      for (let pass = 0; pass < 2; pass += 1) {
        expect(colorWithAlpha(row.c, 0.4)).toBe(row.alpha);
        expect(colorWithAlpha(row.c, 2)).toBe(row.over);
        expect(parseColorChannels(row.c)).toEqual(row.ch);
        expect(mixColors(row.c, "#000000", 0.3)).toBe(row.mix);
        expect(mixColors("#ff0000", row.c, 0.7, 0.5)).toBe(row.mixHi);
      }
    }
  });

  it("returns a fresh channels object each time", () => {
    const first = parseColorChannels("#102030");
    if (first) first.r = 0;
    expect(parseColorChannels("#102030")).toEqual({ r: 16, g: 32, b: 48 });
  });
});
