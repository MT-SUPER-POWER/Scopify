import { describe, expect, it } from "bun:test";
import {
  measurePrefixOffsets,
  rememberBounded,
} from "@/components/lyrics/folia/src/components/visualizer/textMeasureCache";

// 歌词模式共用的有界缓存与前缀偏移测量（Folia f9b331dc、d1d94640）
describe("rememberBounded", () => {
  it("evicts the oldest entry only when a new key overflows the limit", () => {
    const cache = new Map<string, number>();
    rememberBounded(cache, "a", 1, 2);
    rememberBounded(cache, "b", 2, 2);
    expect(rememberBounded(cache, "a", 3, 2)).toBe(3);
    expect([...cache.keys()]).toEqual(["a", "b"]);
    rememberBounded(cache, "c", 4, 2);
    expect([...cache.keys()]).toEqual(["b", "c"]);
  });
});

describe("measurePrefixOffsets", () => {
  it("measures whole prefixes so non-additive widths stay exact", () => {
    // Pairs measure narrower than their parts, as kerning would.
    const measure = (prefix: string) => prefix.length * 10 - (prefix.length >= 2 ? 3 : 0);
    expect(measurePrefixOffsets(["A", "V", "A"], measure)).toEqual([0, 10, 17, 27]);
  });

  it("hands each step its count and the previous offset", () => {
    const steps: [number, number][] = [];
    measurePrefixOffsets(["x", "y"], (_prefix, count, previous) => {
      steps.push([count, previous]);
      return previous + 5;
    });
    expect(steps).toEqual([
      [1, 0],
      [2, 5],
    ]);
  });
});
