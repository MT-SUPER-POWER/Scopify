import { describe, expect, test } from "bun:test";

import {
  resolveChapterTitleOpacity,
  resolvePlaybackTime,
} from "@/lib/marketing/folia-cinematic-timeline";

describe("resolvePlaybackTime", () => {
  test("keeps Sonnet playing while scroll progress stays still", () => {
    const firstFrame = resolvePlaybackTime("sonnet", 0.18, 2);
    const laterFrame = resolvePlaybackTime("sonnet", 0.18, 4);

    expect(laterFrame).toBeGreaterThan(firstFrame);
  });

  test("keeps later Folia scenes tied to scroll progress", () => {
    expect(resolvePlaybackTime("diorama", 0.5, 2)).toBe(resolvePlaybackTime("diorama", 0.5, 8));
    expect(resolvePlaybackTime("partita", 0.82, 2)).toBe(resolvePlaybackTime("partita", 0.82, 8));
  });
});

describe("resolveChapterTitleOpacity", () => {
  test("clears the chapter title before Folia takes over the scene", () => {
    expect(resolveChapterTitleOpacity(0, true)).toBe(1);
    expect(resolveChapterTitleOpacity(0.55, true)).toBe(0);
    expect(resolveChapterTitleOpacity(0.55, false)).toBe(0);
  });
});
