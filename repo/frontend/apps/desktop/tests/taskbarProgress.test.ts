import { describe, expect, test } from "bun:test";
import type { PlaybackProjection } from "@scopify/desktop-contract";
import { resolveTaskbarProgress } from "../electron/main/service/playback/taskbarProgress";

function snapshot(overrides: Partial<PlaybackProjection> = {}): PlaybackProjection {
  return {
    authorityId: "a",
    canControl: true,
    connection: "connected",
    durationMs: 200_000,
    isPlaying: true,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: "playing",
    positionMs: 50_000,
    sessionId: "s",
    track: { artistNames: [], id: 1, title: "t" },
    volume: 100,
    ...overrides,
  };
}

const anchor = { positionMs: 50_000, rate: 1, sampledAtMs: 1_000, timelineRevision: 1 };

describe("resolveTaskbarProgress", () => {
  test("extrapolates position from the clock anchor while playing", () => {
    expect(resolveTaskbarProgress(snapshot(), anchor, 51_000)).toEqual({
      mode: "normal",
      progress: 0.5,
    });
  });

  test("freezes at the anchor and uses paused mode when paused", () => {
    const paused = snapshot({ isPlaying: false, phase: "paused" });
    expect(resolveTaskbarProgress(paused, anchor, 99_000)).toEqual({
      mode: "paused",
      progress: 0.25,
    });
  });

  test("clears when nothing is loaded or playback stopped", () => {
    expect(resolveTaskbarProgress(null, null, 0).progress).toBe(-1);
    expect(resolveTaskbarProgress(snapshot({ track: null }), anchor, 0).progress).toBe(-1);
    expect(resolveTaskbarProgress(snapshot({ durationMs: 0 }), anchor, 0).progress).toBe(-1);
    for (const phase of ["idle", "ended", "error"] as const) {
      expect(resolveTaskbarProgress(snapshot({ phase }), anchor, 0).progress).toBe(-1);
    }
  });

  test("clamps to the end of the track", () => {
    expect(resolveTaskbarProgress(snapshot(), anchor, 10_000_000).progress).toBe(1);
  });
});
