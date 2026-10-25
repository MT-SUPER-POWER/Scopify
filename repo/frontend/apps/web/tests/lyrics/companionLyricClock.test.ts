import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { PlaybackProjection } from "@scopify/desktop-contract";
import type { Line } from "@/components/lyrics/folia/src/types";
import type { PlaybackProjectionExternalStore } from "@/types/playbackTransport";
import {
  createCompanionLyricClock,
  getCompanionLyricCursor,
} from "@/lib/lyrics/companionLyricClock";
import { computeCompanionLyricProgress } from "@/lib/lyrics/companionLyricProgress";

const line = (text: string, startTime: number, endTime: number): Line => ({
  fullText: text,
  startTime,
  endTime,
  words: [],
});
const originalRequest = globalThis.requestAnimationFrame;
const originalCancel = globalThis.cancelAnimationFrame;
let frames = new Map<number, FrameRequestCallback>();
let frameId = 0;

beforeEach(() => {
  frames = new Map();
  frameId = 0;
  globalThis.requestAnimationFrame = (callback) => {
    frames.set(++frameId, callback);
    return frameId;
  };
  globalThis.cancelAnimationFrame = (id) => {
    frames.delete(id);
  };
});
afterEach(() => {
  globalThis.requestAnimationFrame = originalRequest;
  globalThis.cancelAnimationFrame = originalCancel;
});

function setup(lines: Line[], offset = 0) {
  let position = 0;
  let projection: PlaybackProjection = {
    authorityId: "a",
    sessionId: "s",
    connection: "connected",
    isPlaying: true,
    canControl: true,
    durationMs: 30_000,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: "playing",
    positionMs: 0,
    track: null,
    volume: 80,
  };
  const subscribers = new Set<() => void>();
  const store: PlaybackProjectionExternalStore = {
    dispatch: async (command) => ({ commandId: command.commandId, status: "accepted" }),
    getSnapshot: () => projection,
    samplePositionMs: () => position,
    subscribe: (listener) => {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
  };
  const clock = createCompanionLyricClock(store, lines, offset);
  return {
    clock,
    subscribers,
    advance(nextPosition: number) {
      position = nextPosition;
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(nextPosition);
    },
    publish(patch: Partial<PlaybackProjection>, nextPosition = position) {
      position = nextPosition;
      projection = { ...projection, ...patch, positionMs: position };
      for (const listener of subscribers) listener();
    },
  };
}

describe("companion lyric clock", () => {
  it("does not notify the shell during 180 progress frames, then notifies at a line boundary", () => {
    const { clock, advance } = setup([line("hello", 0, 2), line("world", 2, 4)]);
    let notifications = 0;
    const stop = clock.subscribe(() => {
      notifications++;
    });
    for (let frame = 1; frame <= 180; frame++) advance((frame * 1_000) / 180);
    expect(clock.getSnapshot()).toBe(0);
    expect(notifications).toBe(0);
    advance(2_000);
    expect(clock.getSnapshot()).toBe(1);
    expect(notifications).toBe(1);
    stop();
    expect(frames.size).toBe(0);
  });

  it("tracks intro, gaps, overlaps, render-end hints and backward seeks", () => {
    const lines = [line("first", 1, 2), line("second", 4, 5)];
    expect(getCompanionLyricCursor(lines, 0)).toBe(-1);
    expect(getCompanionLyricCursor(lines, 2)).toBe(0);
    expect(getCompanionLyricCursor(lines, 3)).toBe(-2);
    expect(getCompanionLyricCursor(lines, 6)).toBe(-3);
    const overlapping = [line("held", 1, 8), line("short", 2, 3)];
    expect(getCompanionLyricCursor(overlapping, 2.5)).toBe(1);
    expect(getCompanionLyricCursor(overlapping, 4)).toBe(0);
    const held: Line = {
      ...line("held", 1, 2),
      renderHints: {
        rawDuration: 1,
        timingClass: "normal",
        renderEndTime: 3,
        lineTransitionMode: "normal",
        wordRevealMode: "normal",
      },
    };
    expect(getCompanionLyricCursor([held], 2.5)).toBe(0);
    const { clock, publish } = setup(lines);
    const stop = clock.subscribe(() => {});
    publish({}, 4_500);
    expect(clock.getSnapshot()).toBe(1);
    publish({}, 1_500);
    expect(clock.getSnapshot()).toBe(0);
    stop();
  });

  it("applies lyric offset and stops polling when paused, disconnected or unsubscribed", () => {
    const { clock, advance, publish, subscribers } = setup([line("text", 1, 3)], 500);
    const stop = clock.subscribe(() => {});
    advance(1_200);
    expect(clock.getSnapshot()).toBe(-1);
    advance(1_500);
    expect(clock.getSnapshot()).toBe(0);
    publish({ isPlaying: false });
    expect(frames.size).toBe(0);
    publish({ isPlaying: true });
    expect(frames.size).toBe(1);
    publish({ connection: "disconnected" });
    expect(frames.size).toBe(0);
    stop();
    expect(subscribers.size).toBe(0);
  });

  it("does not schedule frames without lyrics", () => {
    const { clock } = setup([]);
    const stop = clock.subscribe(() => {});
    expect(frames.size).toBe(0);
    stop();
  });

  it("catches up on subscription and does not restart frames after synchronous unsubscription", () => {
    const { clock, advance } = setup([line("one", 0, 2), line("two", 3, 5)]);
    advance(1_000);
    const stop = clock.subscribe(() => {
      stop();
    });
    expect(clock.getSnapshot()).toBe(0);
    advance(2_500);
    expect(clock.getSnapshot()).toBe(-2);
    expect(frames.size).toBe(0);
  });
});

describe("companion glyph progress", () => {
  it("keeps emoji and combining sequences intact and follows exact word timing across seeks", () => {
    const current: Line = {
      ...line("👨‍👩‍👧‍👦é", 1, 5),
      words: [
        { text: "👨‍👩‍👧‍👦", startTime: 1, endTime: 3 },
        { text: "é", startTime: 3, endTime: 5 },
      ],
    };
    expect(computeCompanionLyricProgress(current, 0)).toEqual([0, 0]);
    expect(computeCompanionLyricProgress(current, 2)).toEqual([0.5, 0]);
    expect(computeCompanionLyricProgress(current, 4)).toEqual([1, 0.5]);
    expect(computeCompanionLyricProgress(current, 6)).toEqual([1, 1]);
    expect(computeCompanionLyricProgress(current, 2)).toEqual([0.5, 0]);
  });

  it("builds a line's timing once even when sampled every frame", () => {
    const current = line("hello", 0, 5);
    let reads = 0;
    Object.defineProperty(current, "words", {
      get: () => {
        reads++;
        return [];
      },
    });
    computeCompanionLyricProgress(current, 0);
    const initialReads = reads;
    for (let frame = 1; frame <= 180; frame++) computeCompanionLyricProgress(current, frame / 180);
    expect(reads).toBe(initialReads);
    expect(initialReads).toBeGreaterThan(0);
  });
});
