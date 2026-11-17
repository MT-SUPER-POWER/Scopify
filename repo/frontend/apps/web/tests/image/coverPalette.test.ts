import { expect, test } from "bun:test";

import { pickCoverColor } from "@/lib/image/coverPalette";

function swatch(hex: string, proportion: number, l: number, c: number) {
  return {
    hex: () => hex,
    oklch: () => ({ l, c, h: 0 }),
    proportion,
  };
}

test("the main cover color comes from a broad region even when a tiny logo is more vivid", () => {
  expect(
    pickCoverColor([
      swatch("#ff0028", 0.008, 0.63, 0.25),
      swatch("#ece8e0", 0.312, 0.93, 0.015),
      swatch("#3e5c8c", 0.68, 0.48, 0.08),
    ]),
  ).toBe("#3e5c8c");
});

test("low-chroma artwork still supplies a main color and an empty palette falls back", () => {
  expect(pickCoverColor([swatch("#5c5c5c", 0.75, 0.48, 0), swatch("#969696", 0.25, 0.67, 0)])).toBe(
    "#5c5c5c",
  );
  expect(pickCoverColor([])).toBe("");
});
