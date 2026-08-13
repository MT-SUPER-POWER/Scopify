import { describe, expect, test } from "bun:test";

import {
  PLAYBACK_PROTOCOL_VERSION,
  type PlaybackBootstrap,
  type PlaybackClockAnchored,
  type PlaybackSessionState,
  type PlaybackTimelineDiscontinued,
} from "@scopifymusicplayer/desktop-contract";

import { ManualPlaybackClock } from "@/lib/playbackProjection/clock";
import { createInMemoryPlaybackTransport } from "@/lib/playbackProjection/inMemoryTransport";

function createState(trackId = 1): PlaybackSessionState {
  return {
    canControl: true,
    durationMs: 180_000,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: "playing",
    track: {
      artistNames: [trackId === 1 ? "Artist" : "Next artist"],
      id: trackId,
      title: trackId === 1 ? "Song" : "Next song",
    },
    volume: 80,
  };
}

function createBootstrap(
  sequence: number,
  positionMs: number,
  sampledAtMs: number,
  sessionId = "session-a",
  trackId = 1,
): PlaybackBootstrap {
  return {
    anchor: { positionMs, rate: 1, sampledAtMs, timelineRevision: 0 },
    authorityId: "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sequence,
    sessionId,
    state: createState(trackId),
    type: "bootstrap",
  };
}

function createAnchor(
  sequence: number,
  positionMs: number,
  sampledAtMs: number,
): PlaybackClockAnchored {
  return {
    anchor: { positionMs, rate: 1, sampledAtMs, timelineRevision: 0 },
    authorityId: "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sequence,
    sessionId: "session-a",
    type: "clock-anchored",
  };
}

function createSeek(
  sequence: number,
  positionMs: number,
  sampledAtMs: number,
  timelineRevision: number,
): PlaybackTimelineDiscontinued {
  return {
    anchor: { positionMs, rate: 1, sampledAtMs, timelineRevision },
    authorityId: "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    reason: "seek",
    sequence,
    sessionId: "session-a",
    type: "timeline-discontinued",
  };
}

describe("desktop playback timeline regression", () => {
  test("a routine same-session anchor cannot pull the projection backward", () => {
    const clock = new ManualPlaybackClock(1_000);
    const transport = createInMemoryPlaybackTransport({ clock });
    transport.deliver(createBootstrap(1, 10_000, clock.nowMs()));
    clock.advanceBy(300);
    const previousPositionMs = transport.source.getSnapshot().positionMs;

    transport.deliver(createAnchor(2, 10_080, clock.nowMs()));

    expect(transport.source.getSnapshot().positionMs).toBeGreaterThanOrEqual(previousPositionMs);
  });

  test("accepts intentional backward and forward seeks as explicit discontinuities", () => {
    const clock = new ManualPlaybackClock(1_000);
    const transport = createInMemoryPlaybackTransport({ clock });
    transport.deliver(createBootstrap(1, 10_000, clock.nowMs()));

    transport.deliver(createSeek(2, 4_000, clock.nowMs(), 1));
    expect(transport.source.getSnapshot().positionMs).toBe(4_000);

    transport.deliver(createSeek(3, 16_000, clock.nowMs(), 2));
    expect(transport.source.getSnapshot().positionMs).toBe(16_000);
  });

  test("resets immediately when a new playback session starts", () => {
    const clock = new ManualPlaybackClock(1_000);
    const transport = createInMemoryPlaybackTransport({ clock });
    transport.deliver(createBootstrap(1, 10_000, clock.nowMs()));

    transport.deliver(createBootstrap(2, 0, clock.nowMs(), "session-b", 2));

    expect(transport.source.getSnapshot()).toMatchObject({
      positionMs: 0,
      sessionId: "session-b",
      track: { id: 2, title: "Next song" },
    });
  });
});
