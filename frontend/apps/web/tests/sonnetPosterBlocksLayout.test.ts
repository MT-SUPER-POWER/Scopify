import { describe, expect, test } from "bun:test";

import {
  layoutSonnetPosterBlocks,
  type SonnetPosterBlockBox,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetPosterBlocksLayout";

const box = (
  measuredWidth: number,
  measuredHeight: number,
  role: "hero" | "semi-hero" | "support",
): SonnetPosterBlockBox => ({
  isHero: role === "hero",
  isSemiHero: role === "semi-hero",
  displayText: role,
  fontScale: role === "hero" ? 4.4 : role === "semi-hero" ? 3.1 : 1.15,
  measuredWidth,
  measuredHeight,
  x: 0,
  y: 0,
  rotation: 0,
  vertical: false,
  layoutDirection: "horizontal",
  enterX: 0,
  enterY: 0,
});

const makeBoxes = () => [
  box(128, 42, "support"),
  box(184, 68, "semi-hero"),
  box(360, 142, "hero"),
  box(116, 40, "support"),
  box(152, 40, "support"),
  box(208, 66, "semi-hero"),
  box(104, 40, "support"),
];

const separated = (first: SonnetPosterBlockBox, second: SonnetPosterBlockBox) =>
  first.x + first.measuredWidth / 2 <= second.x - second.measuredWidth / 2 ||
  second.x + second.measuredWidth / 2 <= first.x - first.measuredWidth / 2 ||
  first.y + first.measuredHeight / 2 <= second.y - second.measuredHeight / 2 ||
  second.y + second.measuredHeight / 2 <= first.y - first.measuredHeight / 2;

describe("Sonnet poster blocks layout", () => {
  test("packs measured boxes deterministically without collisions", () => {
    const boxes = makeBoxes();
    const plan = layoutSonnetPosterBlocks(boxes, 1280, 720, 40, 28);
    const repeated = layoutSonnetPosterBlocks(makeBoxes(), 1280, 720, 40, 28);

    expect(plan.placements).toEqual(boxes);
    expect(plan.placements).toEqual(repeated.placements);
    for (let firstIndex = 0; firstIndex < boxes.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < boxes.length; secondIndex += 1) {
        expect(separated(boxes[firstIndex], boxes[secondIndex])).toBe(true);
      }
    }
  });

  test("varies composition by seed and keeps dense groups finite", () => {
    const first = layoutSonnetPosterBlocks(makeBoxes(), 1280, 720, 40, 12);
    const alternate = layoutSonnetPosterBlocks(makeBoxes(), 1280, 720, 40, 13);
    const dense = [
      box(420, 150, "hero"),
      box(230, 76, "semi-hero"),
      ...Array.from({ length: 28 }, (_, index) => box(72 + (index % 5) * 18, 38, "support")),
    ];

    layoutSonnetPosterBlocks(dense, 1280, 720, 32, 98);
    expect(alternate.placements.map((item) => item.x)).not.toEqual(
      first.placements.map((item) => item.x),
    );
    expect(dense.every((item) => Number.isFinite(item.x) && Number.isFinite(item.y))).toBe(true);
  });
});
