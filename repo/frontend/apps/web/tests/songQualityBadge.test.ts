import { expect, test } from "bun:test";

import { getSongQualityBadge } from "@/lib/song/qualityBadge";

test("maps premium audio levels to their visual tone", () => {
  expect(getSongQualityBadge("jymaster")).toEqual({ level: "jymaster", tone: "gold" });
  expect(getSongQualityBadge("dolby")).toEqual({ level: "dolby", tone: "gold" });
  expect(getSongQualityBadge("sky")).toEqual({ level: "sky", tone: "gold" });
  expect(getSongQualityBadge("jyeffect")).toEqual({ level: "jyeffect", tone: "gold" });
  expect(getSongQualityBadge("hires")).toEqual({ level: "hires", tone: "red" });
  expect(getSongQualityBadge("lossless")).toEqual({ level: "lossless", tone: "red" });
});

test("omits standard and unknown audio levels", () => {
  expect(getSongQualityBadge("exhigh")).toBeNull();
  expect(getSongQualityBadge("higher")).toBeNull();
  expect(getSongQualityBadge("standard")).toBeNull();
  expect(getSongQualityBadge("none")).toBeNull();
  expect(getSongQualityBadge(undefined)).toBeNull();
});
