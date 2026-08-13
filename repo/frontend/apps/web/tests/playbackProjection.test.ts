import { describe, expect, test } from "bun:test";

import {
  PLAYBACK_PROTOCOL_VERSION,
  type PlaybackBootstrap,
  type PlaybackClockAnchored,
  type PlaybackSessionState,
  type PlaybackStateChanged,
  type PlaybackTimelineDiscontinued,
  validatePlaybackCommand,
  validatePlaybackMessage,
} from "@mt-super-power/desktop-contract";

import { ManualPlaybackClock } from "@/lib/playbackProjection/clock";
import { createInMemoryPlaybackTransport } from "@/lib/playbackProjection/inMemoryTransport";

interface TestLyrics {
  lines: string[];
}

function createState(
  overrides: Partial<PlaybackSessionState<TestLyrics>> = {},
): PlaybackSessionState<TestLyrics> {
  return {
    canControl: true,
    durationMs: 180_000,
    liked: false,
    lyrics: { lines: ["Line one"] },
    lyricsVersion: 1,
    phase: "playing",
    track: {
      artistNames: ["Artist"],
      id: 1,
      title: "Song",
    },
    volume: 80,
    ...overrides,
  };
}

function createBootstrap(
  sequence: number,
  positionMs: number,
  sampledAtMs: number,
  overrides: {
    authorityId?: string;
    rate?: number;
    sessionId?: string;
    state?: Partial<PlaybackSessionState<TestLyrics>>;
    timelineRevision?: number;
  } = {},
): PlaybackBootstrap<TestLyrics> {
  return {
    anchor: {
      positionMs,
      rate: overrides.rate ?? 1,
      sampledAtMs,
      timelineRevision: overrides.timelineRevision ?? 0,
    },
    authorityId: overrides.authorityId ?? "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sequence,
    sessionId: overrides.sessionId ?? "session-a",
    state: createState(overrides.state),
    type: "bootstrap",
  };
}

function createAnchor(
  sequence: number,
  positionMs: number,
  sampledAtMs: number,
  overrides: {
    authorityId?: string;
    rate?: number;
    sessionId?: string;
    timelineRevision?: number;
  } = {},
): PlaybackClockAnchored {
  return {
    anchor: {
      positionMs,
      rate: overrides.rate ?? 1,
      sampledAtMs,
      timelineRevision: overrides.timelineRevision ?? 0,
    },
    authorityId: overrides.authorityId ?? "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sequence,
    sessionId: overrides.sessionId ?? "session-a",
    type: "clock-anchored",
  };
}

function createStateChanged(
  sequence: number,
  sampledAtMs: number,
  state: Partial<PlaybackSessionState<TestLyrics>>,
  overrides: {
    authorityId?: string;
    sessionId?: string;
    timelineRevision?: number;
  } = {},
): PlaybackStateChanged<TestLyrics> {
  return {
    authorityId: overrides.authorityId ?? "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    sampledAtMs,
    sequence,
    sessionId: overrides.sessionId ?? "session-a",
    state: createState(state),
    timelineRevision: overrides.timelineRevision ?? 0,
    type: "state-changed",
  };
}

function createDiscontinuity(
  sequence: number,
  positionMs: number,
  sampledAtMs: number,
  timelineRevision: number,
  overrides: Partial<PlaybackTimelineDiscontinued> = {},
): PlaybackTimelineDiscontinued {
  return {
    anchor: { positionMs, rate: 1, sampledAtMs, timelineRevision },
    authorityId: "authority-a",
    protocolVersion: PLAYBACK_PROTOCOL_VERSION,
    reason: "seek",
    sequence,
    sessionId: "session-a",
    type: "timeline-discontinued",
    ...overrides,
  };
}

describe("playback projection contract", () => {
  test("rejects incompatible protocol versions before applying a message", () => {
    const result = validatePlaybackMessage({
      ...createBootstrap(1, 0, 1_000),
      protocolVersion: PLAYBACK_PROTOCOL_VERSION + 1,
    });

    expect(result).toEqual({ reason: "unsupported-protocol-version", success: false });
  });

  test("validates command payloads at the authority boundary", () => {
    expect(
      validatePlaybackCommand({ commandId: "volume-1", type: "set-volume", volume: 50 }),
    ).toEqual({
      command: { commandId: "volume-1", type: "set-volume", volume: 50 },
      success: true,
    });
    expect(
      validatePlaybackCommand({ commandId: "volume-2", type: "set-volume", volume: 200 }),
    ).toEqual({ reason: "invalid-command-payload", success: false });
  });
});

describe("PlaybackReplica", () => {
  test("exposes the active authority identity in its projection snapshot", () => {
    const clock = new ManualPlaybackClock(500);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });

    expect(transport.source.getSnapshot().authorityId).toBeNull();
    transport.deliver(createBootstrap(1, 0, clock.nowMs()));
    expect(transport.source.getSnapshot().authorityId).toBe("authority-a");

    transport.disconnect();
    transport.deliver(
      createBootstrap(1, 0, clock.nowMs(), {
        authorityId: "authority-b",
        sessionId: "session-b",
      }),
    );
    expect(transport.source.getSnapshot().authorityId).toBe("authority-b");
  });

  test("does not regress from 34s when a delayed same-revision 32s anchor arrives", () => {
    const clock = new ManualPlaybackClock(10_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 34_000, clock.nowMs()));
    const atThirtyFourSeconds = transport.source.getSnapshot().positionMs;

    transport.send(createAnchor(2, 32_000, clock.nowMs()), { delayMs: 2_000 });
    const [delivery] = transport.advanceBy(2_000);

    expect(delivery).toEqual({ accepted: true });
    expect(atThirtyFourSeconds).toBe(34_000);
    expect(transport.source.getSnapshot().positionMs).toBe(36_000);
  });

  test("hard-jumps backward only for an explicit higher timeline revision", () => {
    const clock = new ManualPlaybackClock(1_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 34_000, clock.nowMs()));

    expect(transport.deliver(createDiscontinuity(2, 10_000, clock.nowMs(), 1))).toEqual({
      accepted: true,
    });
    expect(transport.source.getSnapshot().positionMs).toBe(10_000);

    expect(
      transport.deliver(createAnchor(3, 8_000, clock.nowMs(), { timelineRevision: 0 })),
    ).toEqual({ accepted: false, reason: "stale-timeline-revision" });
    expect(transport.source.getSnapshot().positionMs).toBe(10_000);
  });

  test("does not let a same-revision duration shrink bypass the monotonic floor", () => {
    const clock = new ManualPlaybackClock(1_500);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 34_000, clock.nowMs()));
    expect(transport.source.getSnapshot().positionMs).toBe(34_000);

    expect(
      transport.deliver(
        createStateChanged(2, clock.nowMs(), {
          durationMs: 32_000,
          phase: "paused",
        }),
      ),
    ).toEqual({ accepted: true });
    expect(transport.source.getSnapshot().positionMs).toBe(34_000);

    expect(
      transport.deliver(
        createDiscontinuity(3, 32_000, clock.nowMs(), 1, {
          anchor: {
            positionMs: 32_000,
            rate: 0,
            sampledAtMs: clock.nowMs(),
            timelineRevision: 1,
          },
          reason: "media-correction",
        }),
      ),
    ).toEqual({ accepted: true });
    expect(transport.source.getSnapshot().positionMs).toBe(32_000);
  });

  test("freezes a delayed pause at its source sample instead of the receive time", () => {
    const clock = new ManualPlaybackClock(2_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 32_000, clock.nowMs()));

    clock.advanceBy(2_000);
    expect(transport.deliver(createStateChanged(2, 3_000, { phase: "paused" }))).toEqual({
      accepted: true,
    });
    expect(transport.source.getSnapshot().positionMs).toBe(33_000);

    expect(
      transport.deliver(
        createAnchor(3, 33_000, 3_000, {
          rate: 0,
        }),
      ),
    ).toEqual({ accepted: true });
    expect(transport.source.getSnapshot().positionMs).toBe(33_000);
  });

  test("applies a resume checkpoint only as an explicit discontinuity", () => {
    const clock = new ManualPlaybackClock(2_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(
      createBootstrap(1, 0, clock.nowMs(), {
        rate: 0,
        state: { phase: "paused" },
      }),
    );

    transport.deliver(
      createDiscontinuity(2, 45_000, clock.nowMs(), 1, {
        anchor: {
          positionMs: 45_000,
          rate: 0,
          sampledAtMs: clock.nowMs(),
          timelineRevision: 1,
        },
        reason: "resume",
      }),
    );

    expect(transport.source.getSnapshot().positionMs).toBe(45_000);
  });

  test("filters duplicate and out-of-order sequence numbers without notifying subscribers", () => {
    const clock = new ManualPlaybackClock(3_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    let notifications = 0;
    transport.source.subscribe(() => notifications++);
    transport.deliver(createBootstrap(1, 5_000, clock.nowMs()));

    transport.send(createStateChanged(2, clock.nowMs(), { volume: 70 }), {
      delayMs: 100,
    });
    transport.send(createStateChanged(3, clock.nowMs(), { volume: 50 }));
    expect(transport.deliverReady()).toEqual([{ accepted: true }]);
    expect(transport.advanceBy(100)).toEqual([
      { accepted: false, reason: "duplicate-or-out-of-order" },
    ]);
    expect(transport.deliver(createStateChanged(3, clock.nowMs(), { volume: 20 }))).toEqual({
      accepted: false,
      reason: "duplicate-or-out-of-order",
    });

    expect(transport.source.getSnapshot().volume).toBe(50);
    expect(notifications).toBe(2);
  });

  test("atomically replaces a session and rejects delayed messages from the old session", () => {
    const clock = new ManualPlaybackClock(4_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 20_000, clock.nowMs()));

    transport.deliver(
      createBootstrap(5, 0, clock.nowMs(), {
        sessionId: "session-b",
        state: {
          lyrics: { lines: ["Next song"] },
          lyricsVersion: 2,
          track: { artistNames: ["Next artist"], id: 2, title: "Next" },
        },
      }),
    );

    expect(transport.source.getSnapshot()).toMatchObject({
      positionMs: 0,
      sessionId: "session-b",
      track: { id: 2 },
    });
    expect(transport.deliver(createAnchor(6, 40_000, clock.nowMs()))).toEqual({
      accepted: false,
      reason: "session-bootstrap-required",
    });
    expect(transport.source.getSnapshot().sessionId).toBe("session-b");
  });

  test("treats replaying the same track as a new session", () => {
    const clock = new ManualPlaybackClock(5_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 90_000, clock.nowMs()));

    transport.deliver(
      createBootstrap(2, 0, clock.nowMs(), {
        sessionId: "same-track-replay",
      }),
    );

    const replay = transport.source.getSnapshot();
    expect(replay.track?.id).toBe(1);
    expect(replay.sessionId).toBe("same-track-replay");
    expect(replay.positionMs).toBe(0);
  });

  test("rejects a lower-revision Bootstrap for the active Authority session", () => {
    const clock = new ManualPlaybackClock(5_500);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(
      createBootstrap(1, 34_000, clock.nowMs(), {
        timelineRevision: 1,
      }),
    );

    expect(
      transport.deliver(
        createBootstrap(2, 32_000, clock.nowMs(), {
          timelineRevision: 0,
        }),
      ),
    ).toEqual({ accepted: false, reason: "stale-timeline-revision" });
    expect(transport.source.getSnapshot().positionMs).toBe(34_000);
  });

  test("accepts a restarted authority bootstrap and permanently retires the old authority", () => {
    const clock = new ManualPlaybackClock(6_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(100, 30_000, clock.nowMs()));
    transport.disconnect();

    expect(
      transport.deliver(
        createBootstrap(1, 5_000, clock.nowMs(), {
          authorityId: "authority-b",
          sessionId: "authority-b-session",
        }),
      ),
    ).toEqual({ accepted: true });
    expect(transport.source.getSnapshot().positionMs).toBe(5_000);
    expect(transport.deliver(createBootstrap(101, 50_000, clock.nowMs()))).toEqual({
      accepted: false,
      reason: "retired-authority",
    });
    expect(transport.source.getSnapshot().sessionId).toBe("authority-b-session");
  });

  test("freezes through pause and buffering, then resumes from a fresh anchor", () => {
    const clock = new ManualPlaybackClock(7_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 10_000, clock.nowMs()));
    clock.advanceBy(2_000);

    transport.deliver(createStateChanged(2, clock.nowMs(), { phase: "paused" }));
    expect(transport.source.getSnapshot().positionMs).toBe(12_000);
    clock.advanceBy(3_000);
    expect(transport.source.getSnapshot().positionMs).toBe(12_000);

    transport.deliver(createStateChanged(3, clock.nowMs(), { phase: "buffering" }));
    clock.advanceBy(1_000);
    expect(transport.source.getSnapshot().positionMs).toBe(12_000);

    transport.deliver(createStateChanged(4, clock.nowMs(), { phase: "playing" }));
    transport.deliver(createAnchor(5, 12_000, clock.nowMs()));
    clock.advanceBy(1_000);
    expect(transport.source.getSnapshot()).toMatchObject({
      isPlaying: true,
      phase: "playing",
      positionMs: 13_000,
    });
  });

  test("requires an atomic bootstrap after reconnect", () => {
    const clock = new ManualPlaybackClock(8_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 10_000, clock.nowMs()));
    transport.disconnect();
    clock.advanceBy(5_000);
    transport.connect();

    expect(transport.deliver(createAnchor(2, 15_000, clock.nowMs()))).toEqual({
      accepted: false,
      reason: "bootstrap-required",
    });
    expect(transport.source.getSnapshot()).toMatchObject({
      connection: "connecting",
      positionMs: 10_000,
    });

    expect(transport.deliver(createBootstrap(3, 15_000, clock.nowMs()))).toEqual({
      accepted: true,
    });
    expect(transport.source.getSnapshot()).toMatchObject({
      connection: "connected",
      positionMs: 15_000,
    });
  });

  test("freezes immediately on disconnect and at the bounded stale timeout", () => {
    const explicitClock = new ManualPlaybackClock(9_000);
    const explicitTransport = createInMemoryPlaybackTransport<TestLyrics>({
      clock: explicitClock,
    });
    explicitTransport.deliver(createBootstrap(1, 20_000, explicitClock.nowMs()));
    explicitClock.advanceBy(2_000);
    explicitTransport.disconnect();
    explicitClock.advanceBy(10_000);
    expect(explicitTransport.source.getSnapshot()).toMatchObject({
      connection: "disconnected",
      positionMs: 22_000,
    });

    const staleClock = new ManualPlaybackClock(20_000);
    const staleTransport = createInMemoryPlaybackTransport<TestLyrics>({
      clock: staleClock,
      disconnectAfterMs: 1_000,
    });
    staleTransport.deliver(createBootstrap(1, 30_000, staleClock.nowMs()));
    staleClock.advanceBy(1_500);
    expect(staleTransport.source.getSnapshot()).toMatchObject({
      connection: "disconnected",
      positionMs: 31_000,
    });

    expect(staleTransport.deliver(createAnchor(2, 31_500, staleClock.nowMs()))).toEqual({
      accepted: true,
    });
    expect(staleTransport.source.getSnapshot()).toMatchObject({
      connection: "connected",
      positionMs: 31_500,
    });
  });

  test("keeps protocol ordering and anchor details behind the projection source seam", async () => {
    const clock = new ManualPlaybackClock(10_000);
    const transport = createInMemoryPlaybackTransport<TestLyrics>({ clock });
    transport.deliver(createBootstrap(1, 1_000, clock.nowMs()));

    const snapshot = transport.source.getSnapshot();
    expect("sequence" in snapshot).toBeFalse();
    expect("anchor" in snapshot).toBeFalse();
    expect("timelineRevision" in snapshot).toBeFalse();
    expect("nowMs" in snapshot).toBeFalse();

    await expect(
      transport.source.dispatch({ commandId: "seek-1", positionMs: 25_000, type: "seek" }),
    ).resolves.toEqual({ commandId: "seek-1", status: "accepted" });
    expect(transport.dispatchedCommands).toEqual([
      { commandId: "seek-1", positionMs: 25_000, type: "seek" },
    ]);
    expect(transport.source.getSnapshot().positionMs).toBe(1_000);
  });
});
