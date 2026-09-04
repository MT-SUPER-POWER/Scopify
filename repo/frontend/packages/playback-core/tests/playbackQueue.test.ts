import { describe, expect, test } from "bun:test";
import { createPlaybackQueue, type PlaybackQueueItem } from "../src";

const a: PlaybackQueueItem = {
  locator: { kind: "netease", songId: "a" },
  queueItemId: "queue-a",
  track: { artistNames: ["Artist"], id: "a", title: "A" },
};

const b: PlaybackQueueItem = {
  locator: { kind: "netease", songId: "b" },
  queueItemId: "queue-b",
  track: { artistNames: ["Artist"], id: "b", title: "B" },
};

const duplicateA: PlaybackQueueItem = {
  locator: { kind: "netease", songId: "a" },
  queueItemId: "queue-a-second-copy",
  track: { artistNames: ["Artist"], id: "a", title: "A (again)" },
};

describe("PlaybackQueue", () => {
  test("keeps duplicate songs distinct through stable queue item identities", () => {
    const queue = createPlaybackQueue();

    queue.replace([a, duplicateA, b], 1);
    const transition = queue.remove("queue-a");

    expect(transition.snapshot.items.map((item) => item.queueItemId)).toEqual([
      "queue-a-second-copy",
      "queue-b",
    ]);
    expect(transition.snapshot.currentItemId).toBe("queue-a-second-copy");
    expect(transition.effect).toEqual({ type: "none" });
  });

  test("replays only for natural completion under repeat-one", () => {
    const queue = createPlaybackQueue();
    queue.replace([a, b]);
    queue.setRepeatMode("one");

    expect(queue.next("ended").effect).toEqual({
      item: a,
      reason: "ended",
      type: "play",
    });
    expect(queue.next("manual").effect).toEqual({
      item: b,
      reason: "manual",
      type: "play",
    });
  });

  test("stops at a natural queue tail but wraps for a manual next", () => {
    const queue = createPlaybackQueue();
    queue.replace([a, b], 1);

    expect(queue.next("ended").effect).toEqual({ reason: "ended", type: "stop" });
    expect(queue.next("manual").effect).toEqual({
      item: a,
      reason: "manual",
      type: "play",
    });
  });

  test("does not repeat a failed tail solely because repeat-one is enabled", () => {
    const queue = createPlaybackQueue();
    queue.replace([a, b], 1);
    queue.setRepeatMode("one");

    expect(queue.next("failure").effect).toEqual({ reason: "failure", type: "stop" });
  });

  test("keeps the selected queue item when it is moved", () => {
    const queue = createPlaybackQueue();
    queue.replace([a, b, duplicateA], 1);

    const transition = queue.move("queue-b", 0);

    expect(transition.snapshot).toMatchObject({ currentIndex: 0, currentItemId: "queue-b" });
    expect(transition.effect).toEqual({ type: "none" });
  });

  test("uses selection history when returning to a previous shuffled track", () => {
    const queue = createPlaybackQueue({ random: () => 0 });
    queue.replace([a, b, duplicateA]);
    queue.setShuffleEnabled(true);

    const next = queue.next("manual");
    const previous = queue.previous();

    expect(next.effect).toMatchObject({ type: "play" });
    expect(previous.effect).toEqual({ item: a, reason: "previous", type: "play" });
  });

  test("starts a new shuffled cycle without immediately replaying its tail", () => {
    const queue = createPlaybackQueue({ random: () => 0 });
    queue.replace([a, b, duplicateA]);
    queue.setShuffleEnabled(true);
    queue.next("manual");
    queue.next("manual");

    const tailId = queue.getSnapshot().currentItemId;
    const restarted = queue.next("manual");

    expect(restarted.effect).toMatchObject({ type: "play" });
    expect(restarted.effect.type === "play" && restarted.effect.item.queueItemId).not.toBe(tailId);
  });

  test("does not expose internal queue state through snapshots", () => {
    const queue = createPlaybackQueue();
    const initial = queue.replace([a, b]);
    initial.snapshot.items[0]!.track.title = "mutated by a caller";

    expect(queue.getSnapshot().items[0]!.track.title).toBe("A");
  });
});
