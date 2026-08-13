import { describe, expect, test } from "bun:test";
import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type PlaybackCommand,
  type PlaybackCommandReceipt,
  type PlaybackHostControlReceipt,
  type PlaybackHostReplaceSessionCommand,
  type PlaybackHostSessionSnapshot,
  type PlaybackQueueEntry,
  type PlaybackSessionSeed,
} from "@mt-super-power/desktop-contract";

import {
  createPlaybackHostSessionController,
  type PlaybackHostControlPort,
  type PlaybackHostSessionCatalog,
  type PlaybackHostSessionQueue,
  type PlaybackHostSessionRuntimePort,
} from "../lib/playbackHost/sessionController";

const trackA = entry(1, "A");
const trackB = entry(2, "B");
const trackC = entry(3, "C");

class TestControlPort implements PlaybackHostControlPort {
  readonly sent: Array<PlaybackHostControlReceipt | PlaybackHostSessionSnapshot> = [];
  private listener: ((payload: unknown) => void) | null = null;

  onMessage(listener: (payload: unknown) => void): () => void {
    this.listener = listener;
    return () => {
      if (this.listener === listener) this.listener = null;
    };
  }

  postMessage(payload: PlaybackHostControlReceipt | PlaybackHostSessionSnapshot): void {
    this.sent.push(payload);
  }

  deliver(payload: unknown): void {
    this.listener?.(payload);
  }
}

class TestRuntime implements PlaybackHostSessionRuntimePort {
  readonly calls: string[] = [];
  readonly seededKeys: string[] = [];
  rollbackCalls = 0;
  source: "failed" | "ready" | "superseded" = "ready";
  dispatchStatus: PlaybackCommandReceipt["status"] = "accepted";

  constructor(private readonly queue: PlaybackHostSessionQueue) {}

  async advanceOnEnded(): Promise<boolean> {
    this.calls.push("advanceOnEnded");
    const next = this.queue.next("ended");
    if (!next) return false;
    await this.seedSession(next);
    return true;
  }

  async clearSession(): Promise<void> {
    this.calls.push("clearSession");
  }

  captureCheckpoint() {
    return {
      rollback: async () => {
        this.rollbackCalls += 1;
      },
    };
  }

  async dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    this.calls.push(`dispatch:${command.type}`);
    if (this.dispatchStatus === "accepted")
      return { commandId: command.commandId, status: "accepted" };
    if (this.dispatchStatus === "rejected") {
      return { commandId: command.commandId, reason: "test-command-failed", status: "rejected" };
    }
    return { commandId: command.commandId, reason: "test-command-failed", status: "unavailable" };
  }

  async ensureSource(): Promise<"failed" | "ready" | "superseded"> {
    this.calls.push("ensureSource");
    return this.source;
  }

  async refreshSource(): Promise<"failed" | "ready" | "superseded"> {
    this.calls.push("refreshSource");
    return this.source;
  }

  async seedSession(session: { key: string }): Promise<void> {
    this.calls.push("seedSession");
    this.seededKeys.push(session.key);
  }
}

function entry(id: number, title: string): PlaybackQueueEntry {
  return {
    album: { artworkUrl: `https://img.test/${id}`, id, title: `Album ${title}` },
    artists: [{ id, name: `Artist ${title}` }],
    durationMs: 180_000,
    fee: 0,
    id,
    publishTime: 0,
    title,
  };
}

function seed(
  revision: number,
  intent: "pause" | "play" = "play",
  entries: PlaybackQueueEntry[] = [trackA, trackB],
  repeatMode: PlaybackSessionSeed["queue"]["repeatMode"] = "off",
): PlaybackSessionSeed {
  return {
    intent,
    quality: "high",
    queue:
      entries.length === 0
        ? {
            historyIndex: -1,
            historyStack: [],
            originalQueue: [],
            playlistId: null,
            queue: [],
            queueIndex: -1,
            repeatMode,
            shuffleEnabled: false,
          }
        : {
            historyIndex: 0,
            historyStack: [0],
            originalQueue: entries,
            playlistId: null,
            queue: entries,
            queueIndex: 0,
            repeatMode,
            shuffleEnabled: false,
          },
    resumePositionMs: 0,
    revision,
    volume: 0.6,
  };
}

function command(session: PlaybackSessionSeed): PlaybackHostReplaceSessionCommand {
  return {
    commandId: `replace-${session.revision}`,
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    session,
    type: "replace-session",
  };
}

function createFixture() {
  const port = new TestControlPort();
  const catalog: PlaybackHostSessionCatalog = {
    createRuntimeSession({
      entry: queueEntry,
      intent,
      positionMs,
      reason,
      sourceLoadRevision,
      volume,
    }) {
      return {
        key: `${sourceLoadRevision}:${queueEntry.id}`,
        positionMs,
        reason,
        sourceLoadRevision,
        state: {
          canControl: true,
          durationMs: queueEntry.durationMs,
          liked: false,
          lyrics: null,
          lyricsVersion: null,
          phase: intent === "play" ? "loading" : "paused",
          track: {
            albumTitle: queueEntry.album.title,
            artistNames: queueEntry.artists.map((artist) => artist.name),
            artworkUrl: queueEntry.album.artworkUrl,
            id: queueEntry.id,
            title: queueEntry.title,
          },
          volume: volume * 100,
        },
      };
    },
  };

  let runtime: TestRuntime | null = null;
  const controller = createPlaybackHostSessionController({
    catalog,
    createRuntime(queue) {
      runtime = new TestRuntime(queue);
      return runtime;
    },
    port,
  });

  return { controller, port, runtime: runtime! };
}

describe("PlaybackHostSessionController", () => {
  test("rejects a stale revision without replacing the accepted queue", async () => {
    const { controller, port } = createFixture();
    await controller.handlePayload(command(seed(3)));

    const rejected = await controller.handlePayload(command(seed(3, "play", [trackB])));

    expect(rejected).toMatchObject({
      reason: "stale-session-revision",
      revision: 3,
      status: "rejected",
    });
    expect(controller.sessionSnapshot()?.session.queue.queue[0]?.id).toBe(trackA.id);
    expect(port.sent.at(-1)).toMatchObject({
      reason: "stale-session-revision",
      status: "rejected",
      type: "command-receipt",
    });
  });

  test("seeds, prepares the source, dispatches the requested play or pause, and emits a snapshot", async () => {
    const { controller, port, runtime } = createFixture();

    const playReceipt = await controller.handlePayload(command(seed(5, "play")));
    const pauseReceipt = await controller.handlePayload(command(seed(6, "pause")));

    expect(playReceipt).toMatchObject({ revision: 5, status: "applied" });
    expect(pauseReceipt).toMatchObject({ revision: 6, status: "applied" });
    expect(runtime.calls).toEqual([
      "seedSession",
      "ensureSource",
      "dispatch:play",
      "seedSession",
      "ensureSource",
      "dispatch:pause",
    ]);
    expect(port.sent.filter((message) => message.type === "session-snapshot")).toHaveLength(2);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { intent: "pause", revision: 6 },
      type: "session-snapshot",
    });
  });

  test("advances through the controller-owned QueuePort after ended and loads the new session", async () => {
    const { controller, port, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));

    const advanced = await controller.handleEnded();

    expect(advanced).toBe(true);
    expect(runtime.calls).toEqual([
      "seedSession",
      "ensureSource",
      "dispatch:play",
      "advanceOnEnded",
      "seedSession",
      "ensureSource",
      "dispatch:play",
    ]);
    expect(runtime.seededKeys).toEqual(["1:1", "2:2"]);
    expect(controller.sessionSnapshot()?.session.queue.queueIndex).toBe(1);
    expect(port.sent.at(-1)).toMatchObject({
      session: { queue: { queueIndex: 1 } },
      type: "session-snapshot",
    });
  });

  test("durably pauses at the end of a one-track non-repeating queue", async () => {
    const { controller, port, runtime } = createFixture();
    await controller.handlePayload(command(seed(1, "play", [trackA])));

    expect(await controller.handleEnded()).toBe(false);

    expect(runtime.calls).toEqual([
      "seedSession",
      "ensureSource",
      "dispatch:play",
      "advanceOnEnded",
    ]);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { intent: "pause", queue: { queueIndex: 0 }, revision: 2 },
    });
    expect(port.sent.at(-1)).toMatchObject({
      session: { intent: "pause", revision: 2 },
      type: "session-snapshot",
    });
  });

  test("does not advance twice when Authority emits both ended phase and ended callback", async () => {
    const { controller, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));

    expect(await controller.handlePhaseChange("ended")).toBe(false);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 0 }, revision: 1 },
    });
    expect(await controller.handleEnded()).toBe(true);

    expect(runtime.calls.filter((call) => call === "advanceOnEnded")).toHaveLength(1);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 1 }, revision: 2 },
    });
  });

  test("wraps previous from the first Host queue item to the tail with coherent history", async () => {
    const { controller, runtime } = createFixture();
    await controller.handlePayload(command(seed(1, "play", [trackA, trackB, trackC])));

    expect(await controller.handlePrevious()).toBe(true);

    expect(runtime.seededKeys).toEqual(["1:1", "2:3"]);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: {
        queue: { historyIndex: 0, historyStack: [2], queueIndex: 2 },
        revision: 2,
      },
    });
  });

  test("retries the same Host-owned session with a fresh source before advancing the queue", async () => {
    const { controller, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));

    expect(await controller.handleMediaError()).toBe(true);

    expect(runtime.calls).toEqual([
      "seedSession",
      "ensureSource",
      "dispatch:play",
      "refreshSource",
      "dispatch:play",
    ]);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 0 }, revision: 1 },
    });
  });

  test("falls back through the controller queue and pauses the canonical session when recovery is exhausted", async () => {
    const { controller, runtime } = createFixture();
    await controller.handlePayload(command(seed(1, "play", [trackA])));
    runtime.source = "failed";

    expect(await controller.handleMediaError()).toBe(false);

    expect(runtime.calls).toEqual([
      "seedSession",
      "ensureSource",
      "dispatch:play",
      "refreshSource",
    ]);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { intent: "pause", queue: { queueIndex: 0 }, revision: 2 },
    });
  });

  test("accepts an empty queue as a valid stop session and publishes its canonical snapshot", async () => {
    const { controller, port, runtime } = createFixture();

    const receipt = await controller.handlePayload(command(seed(1, "pause", [])));

    expect(receipt).toMatchObject({ revision: 1, status: "applied" });
    expect(runtime.calls).toEqual(["clearSession"]);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queue: [], queueIndex: -1 }, revision: 1 },
      type: "session-snapshot",
    });
    expect(port.sent.at(-1)).toMatchObject({
      session: { queue: { queue: [], queueIndex: -1 } },
      type: "session-snapshot",
    });
  });

  test("uses the one Host-owned queue for manual next and previous transitions", async () => {
    const { controller, port, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));

    expect(await controller.handleNext()).toBe(true);
    expect(await controller.handlePrevious()).toBe(true);

    expect(runtime.seededKeys).toEqual(["1:1", "2:2", "3:1"]);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 0 }, revision: 3 },
    });
    expect(port.sent.filter((message) => message.type === "session-snapshot")).toHaveLength(3);
  });

  test("does not publish or retain a failed queue transition", async () => {
    const { controller, port, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));
    runtime.source = "failed";
    const snapshotsBefore = port.sent.filter(
      (message) => message.type === "session-snapshot",
    ).length;

    expect(await controller.handleNext()).toBe(false);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 0 }, revision: 1 },
    });
    expect(port.sent.filter((message) => message.type === "session-snapshot")).toHaveLength(
      snapshotsBefore,
    );
  });

  test("publishes only durable Authority intent or volume patches as new canonical revisions", async () => {
    const { controller, port } = createFixture();
    await controller.handlePayload(command(seed(1)));

    expect(await controller.updatePlaybackState({ intent: "pause" })).toBe(true);
    expect(await controller.updatePlaybackState({ volume: 25 })).toBe(true);
    expect(await controller.updatePlaybackState({ intent: "pause", volume: 25 })).toBe(false);
    expect(await controller.handlePhaseChange("playing")).toBe(true);

    expect(controller.sessionSnapshot()).toMatchObject({
      session: { intent: "play", revision: 4, volume: 0.25 },
    });
    expect(port.sent.filter((message) => message.type === "session-snapshot")).toHaveLength(4);
  });

  test("publishes a coarse resume checkpoint without touching Runtime or queue selection", async () => {
    const { controller, port, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));
    const callsBefore = [...runtime.calls];

    expect(await controller.updateResumePosition(32_100)).toBe(true);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { resumePositionMs: 32_100, revision: 2 },
    });
    expect(runtime.calls).toEqual(callsBefore);
    expect(port.sent.at(-1)).toMatchObject({
      session: { resumePositionMs: 32_100, revision: 2 },
      type: "session-snapshot",
    });
  });

  test("rejects invalid or unchanged resume checkpoints without advancing revision", async () => {
    const { controller, port } = createFixture();
    await controller.handlePayload(command(seed(1)));
    const snapshotsBefore = port.sent.filter(
      (message) => message.type === "session-snapshot",
    ).length;

    expect(await controller.updateResumePosition(Number.NaN)).toBe(false);
    expect(await controller.updateResumePosition(-1)).toBe(false);
    expect(await controller.updateResumePosition(0)).toBe(false);
    expect(controller.sessionSnapshot()?.session.revision).toBe(1);
    expect(port.sent.filter((message) => message.type === "session-snapshot")).toHaveLength(
      snapshotsBefore,
    );
  });

  test("clamps checkpoints to track duration and ignores checkpoints for an empty session", async () => {
    const { controller } = createFixture();
    await controller.handlePayload(command(seed(1)));

    expect(await controller.updateResumePosition(999_999)).toBe(true);
    expect(controller.sessionSnapshot()?.session.resumePositionMs).toBe(trackA.durationMs);
    await controller.handlePayload(command(seed(3, "pause", [])));
    expect(await controller.updateResumePosition(1_000)).toBe(false);
    expect(controller.sessionSnapshot()?.session.revision).toBe(3);
  });

  test("does not overflow or publish a partial canonical transition at the safe revision limit", async () => {
    const { controller, port } = createFixture();
    await controller.handlePayload(command(seed(Number.MAX_SAFE_INTEGER)));
    const snapshotsBefore = port.sent.filter(
      (message) => message.type === "session-snapshot",
    ).length;

    expect(await controller.updatePlaybackState({ intent: "pause" })).toBe(false);
    expect(await controller.updateResumePosition(100)).toBe(false);
    expect(await controller.handleNext()).toBe(false);
    expect(controller.sessionSnapshot()?.session.revision).toBe(Number.MAX_SAFE_INTEGER);
    expect(port.sent.filter((message) => message.type === "session-snapshot")).toHaveLength(
      snapshotsBefore,
    );
  });

  test("executes queue selection and play-from-song replacement only in the Host queue", async () => {
    const { controller, port, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));

    const selectReceipt = await controller.handlePayload({
      addToHistory: true,
      commandId: "queue-select-b",
      index: 1,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "select-queue-index",
    });
    const replaceReceipt = await controller.handlePayload({
      commandId: "queue-play-from-a",
      play: true,
      playlistId: "playlist:featured",
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      queue: [trackA, trackB],
      startIndex: 0,
      type: "replace-queue",
    });

    expect(selectReceipt).toMatchObject({ revision: 2, status: "applied" });
    expect(replaceReceipt).toMatchObject({ revision: 3, status: "applied" });
    expect(runtime.seededKeys).toEqual(["1:1", "2:2", "3:1"]);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: {
        intent: "play",
        queue: { playlistId: "playlist:featured", queueIndex: 0 },
        revision: 3,
      },
    });
    expect(port.sent.at(-1)).toMatchObject({
      session: { revision: 3 },
      type: "session-snapshot",
    });
  });

  test("commits queue-only commands as fresh authoritative revisions without reloading media", async () => {
    const { controller, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));
    const callsBefore = [...runtime.calls];

    await controller.handlePayload({
      commandId: "queue-replace-without-play",
      play: false,
      playlistId: "playlist:queue-only",
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      queue: [trackA, trackB],
      startIndex: 0,
      type: "replace-queue",
    });
    await controller.handlePayload({
      commandId: "queue-repeat",
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      repeatMode: "all",
      type: "set-repeat-mode",
    });
    await controller.handlePayload({
      commandId: "queue-shuffle",
      enabled: true,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "set-shuffle",
    });
    await controller.handlePayload({
      commandId: "queue-reshuffle",
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "reshuffle-queue",
    });
    await controller.handlePayload({
      commandId: "queue-move",
      fromIndex: 1,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      toIndex: 0,
      type: "move-queue-item",
    });
    await controller.handlePayload({
      commandId: "queue-move-next",
      index: 0,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "move-queue-item-to-next",
    });
    await controller.handlePayload({
      commandId: "queue-toggle-shuffle",
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "toggle-shuffle",
    });

    expect(runtime.calls).toEqual(callsBefore);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: {
        queue: {
          playlistId: "playlist:queue-only",
          repeatMode: "all",
          shuffleEnabled: false,
        },
        revision: 8,
      },
    });
  });

  test("removes the final Host queue item by clearing media and publishing a paused canonical session", async () => {
    const { controller, runtime } = createFixture();
    await controller.handlePayload(command(seed(1, "play", [trackA])));

    const receipt = await controller.handlePayload({
      commandId: "queue-remove-only-track",
      index: 0,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "remove-queue-item",
    });

    expect(receipt).toMatchObject({ revision: 2, status: "applied" });
    expect(runtime.calls.at(-1)).toBe("clearSession");
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { intent: "pause", queue: { queue: [], queueIndex: -1 }, revision: 2 },
    });
  });

  test("rolls back the runtime and rejects an unplayable queue command without publishing it", async () => {
    const { controller, port, runtime } = createFixture();
    await controller.handlePayload(command(seed(1)));
    runtime.source = "failed";
    const snapshotsBefore = port.sent.filter(
      (message) => message.type === "session-snapshot",
    ).length;

    const receipt = await controller.handlePayload({
      addToHistory: true,
      commandId: "queue-select-failed",
      index: 1,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      type: "select-queue-index",
    });

    expect(receipt).toMatchObject({
      reason: "playback-source-failed",
      revision: 1,
      status: "rejected",
    });
    expect(runtime.rollbackCalls).toBe(1);
    expect(controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 0 }, revision: 1 },
    });
    expect(port.sent.filter((message) => message.type === "session-snapshot")).toHaveLength(
      snapshotsBefore,
    );
  });
});
