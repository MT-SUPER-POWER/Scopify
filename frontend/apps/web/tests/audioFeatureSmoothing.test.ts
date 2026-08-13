import { describe, expect, test } from "bun:test";

import {
  AudioFeatureRuntime,
  type AudioFeatureFrameLike,
} from "@/lib/desktopPlaybackWallpaper/audioFeatureRuntime";

const identity = { authorityId: "authority-a", sessionId: "session-a" };

function frame(overrides: Partial<AudioFeatureFrameLike> = {}): AudioFeatureFrameLike {
  return {
    ...identity,
    bass: 120,
    lowMid: 100,
    mid: 80,
    power: 200,
    sequence: 1,
    spectrum: [40, 180, 255],
    streamId: "stream-a",
    treble: 60,
    vocal: 140,
    ...overrides,
  };
}

describe("desktop wallpaper audio feature smoothing", () => {
  test("filters frames by authority, session, and strictly increasing sequence", () => {
    const runtime = new AudioFeatureRuntime();
    runtime.setExpectedIdentity(identity);

    expect(runtime.accept(frame(), 100)).toBe(true);
    expect(runtime.accept(frame({ sequence: 1 }), 101)).toBe(false);
    expect(runtime.accept(frame({ authorityId: "previous-authority", sequence: 2 }), 103)).toBe(
      false,
    );
    expect(runtime.accept(frame({ sessionId: "previous-session", sequence: 2 }), 103)).toBe(false);
    expect(runtime.accept(frame({ sequence: 2 }), 104)).toBe(true);
  });

  test("uses receive time rather than the producer timestamp and decays without hard-clearing spectrum", () => {
    const runtime = new AudioFeatureRuntime();
    runtime.setExpectedIdentity(identity);
    expect(runtime.accept(frame(), 100)).toBe(true);

    expect(runtime.getTarget(350).power).toBe(200);
    const decaying = runtime.getTarget(725);
    expect(decaying.power).toBeGreaterThan(0);
    expect(decaying.power).toBeLessThan(200);
    expect(decaying.spectrum).toHaveLength(3);

    const stale = runtime.getTarget(1_101);
    expect(stale.power).toBe(0);
    expect(stale.bass).toBe(0);
    expect(stale.spectrum).toEqual(new Uint8Array([0, 0, 0]));
  });

  test("starts a new ordering epoch at sequence zero and retires delayed previous streams", () => {
    const runtime = new AudioFeatureRuntime();
    runtime.setExpectedIdentity(identity);
    expect(runtime.accept(frame({ sequence: 9 }), 100)).toBe(true);

    // A reconnect creates stream-b; its sequence starts over without requiring
    // a reliable playback-session identity change.
    expect(runtime.accept(frame({ sequence: 4, streamId: "unknown-stream" }), 100.5)).toBe(false);
    expect(runtime.accept(frame({ sequence: 0, streamId: "stream-b" }), 101)).toBe(true);
    expect(runtime.accept(frame({ sequence: 10, streamId: "stream-a" }), 102)).toBe(false);
    expect(runtime.accept(frame({ sequence: 1, streamId: "stream-b" }), 103)).toBe(true);

    // Reconnect again. Both earlier stream IDs are retired and cannot revive
    // when their delayed packets interleave with the current stream.
    expect(runtime.accept(frame({ sequence: 0, streamId: "stream-c" }), 104)).toBe(true);
    expect(runtime.accept(frame({ sequence: 2, streamId: "stream-b" }), 105)).toBe(false);
    expect(runtime.accept(frame({ sequence: 11, streamId: "stream-a" }), 106)).toBe(false);
    expect(runtime.accept(frame({ sequence: 1, streamId: "stream-c" }), 107)).toBe(true);
  });

  test("allows an entirely new stream once reliable playback identity changes", () => {
    const runtime = new AudioFeatureRuntime();
    runtime.setExpectedIdentity(identity);
    expect(runtime.accept(frame({ sequence: 9 }), 100)).toBe(true);
    expect(runtime.accept(frame({ sequence: 0, streamId: "stream-b" }), 101)).toBe(true);

    runtime.setExpectedIdentity({ authorityId: "authority-b", sessionId: "session-b" });
    expect(
      runtime.accept(
        frame({
          authorityId: "authority-b",
          sequence: 0,
          sessionId: "session-b",
          streamId: "stream-b",
        }),
        102,
      ),
    ).toBe(true);
  });

  test("smooths the renderer-owned output instead of tying it to feature arrivals", () => {
    const runtime = new AudioFeatureRuntime();
    runtime.setExpectedIdentity(identity);
    runtime.accept(frame(), 0);

    const first = runtime.advance(16.67);
    const second = runtime.advance(33.34);
    expect(first.power).toBeGreaterThan(0);
    expect(first.power).toBeLessThan(200);
    expect(second.power).toBeGreaterThan(first.power);
  });
});
