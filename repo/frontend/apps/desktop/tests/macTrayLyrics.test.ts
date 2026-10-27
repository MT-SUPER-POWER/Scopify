import { expect, test } from "bun:test";
import { cropMacTrayLyric, getMacTrayLyricFrame } from "../electron/main/window/macTrayLyrics";

test("short lines stay still without a scroll timer", () => {
  expect(getMacTrayLyricFrame(0, 5000)).toEqual({ offset: 0, nextUpdateMs: null });
});

test("long lines hold at both ends and loop through the full width", () => {
  expect(getMacTrayLyricFrame(96, 0)).toEqual({ offset: 0, nextUpdateMs: 1200 });
  expect(getMacTrayLyricFrame(96, 1199).offset).toBe(0);
  expect(getMacTrayLyricFrame(96, 1200).offset).toBe(0);
  expect(getMacTrayLyricFrame(96, 2200).offset).toBe(48);
  expect(getMacTrayLyricFrame(96, 3200)).toEqual({ offset: 96, nextUpdateMs: 1200 });
  expect(getMacTrayLyricFrame(96, 4399).offset).toBe(96);
  expect(getMacTrayLyricFrame(96, 4400).offset).toBe(0);
});

test("animation advances by less than one physical pixel per frame", () => {
  const first = getMacTrayLyricFrame(96, 1300);
  const second = getMacTrayLyricFrame(96, 1300 + first.nextUpdateMs!);
  expect(first.nextUpdateMs).toBeCloseTo(1000 / 60);
  expect(second.offset - first.offset).toBeCloseTo(0.8);
});

test("bitmap cropping preserves a fixed viewport and clamps both edges", () => {
  const bitmap = {
    width: 4,
    height: 2,
    viewportWidth: 2,
    pixels: Buffer.from(Array.from({ length: 32 }, (_, i) => i)),
  };
  expect(cropMacTrayLyric(bitmap, -10)).toEqual(
    Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23]),
  );
  expect(cropMacTrayLyric(bitmap, 100)).toEqual(
    Buffer.from([8, 9, 10, 11, 12, 13, 14, 15, 24, 25, 26, 27, 28, 29, 30, 31]),
  );
  expect(cropMacTrayLyric(bitmap, 0.6)).toEqual(cropMacTrayLyric(bitmap, 1));
});
