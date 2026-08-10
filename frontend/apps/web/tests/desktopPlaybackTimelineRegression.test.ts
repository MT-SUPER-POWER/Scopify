import { describe, expect, test } from "bun:test";

import { createDesktopPlaybackTimeline } from "@/lib/desktopPlaybackWallpaper/playback";
import type { DesktopLyricSnapshot } from "@/types/desktopLyric";

function createSnapshot(
  positionMs: number,
  updatedAt: number,
  overrides: Partial<DesktopLyricSnapshot> = {},
): DesktopLyricSnapshot {
  return {
    isLiked: false,
    isPlaying: true,
    lyrics: null,
    positionMs,
    track: {
      artistNames: ["Artist"],
      durationMs: 180_000,
      id: 1,
      title: "Song",
    },
    updatedAt,
    ...overrides,
  };
}

describe("desktop playback timeline regression", () => {
  test("a routine same-track snapshot cannot pull the interpolated clock backward", () => {
    const timeline = createDesktopPlaybackTimeline();
    const previousSnapshot = createSnapshot(10_000, 1_000);
    timeline.accept(previousSnapshot);
    const previousPositionMs = timeline.sample(1_300);

    const newerSnapshot = createSnapshot(10_080, 1_300);
    timeline.accept(newerSnapshot);
    const nextPositionMs = timeline.sample(1_300);

    expect(nextPositionMs).toBeGreaterThanOrEqual(previousPositionMs);
  });

  test("still accepts an intentional backward seek on the same track", () => {
    const timeline = createDesktopPlaybackTimeline();
    timeline.accept(createSnapshot(10_000, 1_000));

    timeline.accept(createSnapshot(4_000, 1_300));

    expect(timeline.sample(1_300)).toBe(4_000);
  });

  test("still accepts an intentional forward seek on the same track", () => {
    const timeline = createDesktopPlaybackTimeline();
    timeline.accept(createSnapshot(10_000, 1_000));

    timeline.accept(createSnapshot(16_000, 1_300));

    expect(timeline.sample(1_300)).toBe(16_000);
  });

  test("resets immediately when the canonical snapshot changes tracks", () => {
    const timeline = createDesktopPlaybackTimeline();
    timeline.accept(createSnapshot(10_000, 1_000));

    timeline.accept(
      createSnapshot(0, 1_300, {
        track: {
          artistNames: ["Next artist"],
          durationMs: 200_000,
          id: 2,
          title: "Next song",
        },
      }),
    );

    expect(timeline.sample(1_300)).toBe(0);
  });
});
