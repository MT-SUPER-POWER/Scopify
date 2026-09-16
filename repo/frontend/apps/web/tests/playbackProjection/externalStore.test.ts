import { expect, test } from "bun:test";
import type { PlaybackSessionState } from "@scopify/desktop-contract";
import { ManualPlaybackClock } from "@/lib/playbackProjection/clock";
import { createPlaybackReplica } from "@/lib/playbackProjection/replica";
import { createPlaybackProjectionStore } from "@/lib/playbackProjection/externalStore";

const pausedState: PlaybackSessionState = {
  canControl: true,
  durationMs: 180000,
  liked: false,
  lyrics: null,
  lyricsVersion: null,
  phase: "paused",
  track: null,
  volume: 80,
};
function setup() {
  const clock = new ManualPlaybackClock();
  const replica = createPlaybackReplica({ clock, disconnectAfterMs: 3000 });
  const envelope = { protocolVersion: 1 as const, authorityId: "authority", sessionId: "session" };
  replica.receive({
    ...envelope,
    type: "bootstrap",
    sequence: 1,
    state: pausedState,
    anchor: { positionMs: 10000, rate: 0, sampledAtMs: 0, timelineRevision: 0 },
  });
  const store = createPlaybackProjectionStore(replica);
  return { clock, replica, store, envelope };
}

test("paused heartbeats keep the React snapshot and subscribers idle while preserving liveness", () => {
  const { clock, replica, store, envelope } = setup();
  let notifications = 0;
  store.subscribe(() => notifications++);
  notifications = 0;
  const snapshot = store.getSnapshot();
  try {
    for (let sequence = 2; sequence <= 12; sequence++) {
      clock.advanceBy(1000);
      replica.receive({
        ...envelope,
        type: "clock-anchored",
        sequence,
        anchor: { positionMs: 10000, rate: 0, sampledAtMs: clock.nowMs(), timelineRevision: 0 },
      });
    }
    expect(replica.getSnapshot().connection).toBe("connected");
    expect(store.getSnapshot()).toBe(snapshot);
    expect(notifications).toBe(0);
  } finally {
    store.dispose();
  }
});

test("real phase, position and control changes still notify and use the live clock", () => {
  const { clock, replica, store, envelope } = setup();
  let notifications = 0;
  store.subscribe(() => notifications++);
  notifications = 0;
  try {
    replica.receive({
      ...envelope,
      type: "state-changed",
      sequence: 2,
      sampledAtMs: 0,
      timelineRevision: 0,
      state: { ...pausedState, phase: "playing", liked: true, volume: 30 },
    });
    replica.receive({
      ...envelope,
      type: "timeline-discontinued",
      sequence: 3,
      reason: "resume",
      anchor: { positionMs: 10000, rate: 1, sampledAtMs: 0, timelineRevision: 1 },
    });
    clock.advanceBy(500);
    expect(store.samplePositionMs()).toBe(10500);
    expect(store.getSnapshot().isPlaying).toBe(true);
    expect(store.getSnapshot().liked).toBe(true);
    expect(store.getSnapshot().volume).toBe(30);
    replica.receive({
      ...envelope,
      type: "timeline-discontinued",
      sequence: 4,
      reason: "seek",
      anchor: { positionMs: 20000, rate: 1, sampledAtMs: 500, timelineRevision: 2 },
    });
    expect(store.getSnapshot().positionMs).toBe(20000);
    expect(notifications).toBeGreaterThanOrEqual(2);
  } finally {
    store.dispose();
  }
});

test("watchdog still reports an authority disconnect without incoming messages", async () => {
  const { clock, store } = setup();
  let notifications = 0;
  store.subscribe(() => notifications++);
  notifications = 0;
  try {
    clock.advanceBy(4000);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(store.getSnapshot().connection).toBe("disconnected");
    expect(notifications).toBe(1);
  } finally {
    store.dispose();
  }
});
