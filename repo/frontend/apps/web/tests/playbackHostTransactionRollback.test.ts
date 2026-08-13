import { describe, expect, test } from "bun:test";
import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type PlaybackCommand,
  type PlaybackCommandReceipt,
  type PlaybackHostReplaceSessionCommand,
  type PlaybackQueueEntry,
  type PlaybackSessionState,
  type PlaybackSessionSeed,
} from "@mt-super-power/desktop-contract";

import type { PlaybackRuntimeSession } from "@/lib/playbackHost/catalog";
import { createPlaybackHostMediaProjection } from "@/lib/playbackHost/hostMediaProjection";
import { createPlaybackCatalogPort } from "@/lib/playbackHost/neteaseCatalog";
import {
  createPlaybackRuntime,
  type PlaybackRuntimeAuthorityPort,
} from "@/lib/playbackHost/runtime";
import {
  createPlaybackHostSessionController,
  type PlaybackHostControlPort,
  type PlaybackHostSessionCatalog,
  type PlaybackHostSessionQueue,
  type PlaybackHostSessionRuntimePort,
} from "@/lib/playbackHost/sessionController";
import type { PlaybackHostMediaProjectionTransaction } from "@/types/playbackHostMediaProjection";

const trackA = entry(1, "A");
const trackB = entry(2, "B");

class TestAuthority implements PlaybackRuntimeAuthorityPort {
  readonly seededTrackIds: Array<number | null> = [];
  dispatchStatus: PlaybackCommandReceipt["status"] = "accepted";

  async dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    return this.dispatchStatus === "accepted"
      ? { commandId: command.commandId, status: "accepted" }
      : {
          commandId: command.commandId,
          reason: "test-command-failure",
          status: this.dispatchStatus,
        };
  }

  seedSession(
    state: PlaybackSessionState,
    _options: { positionMs: number; reason: "replay" | "resume" | "track-change" },
  ) {
    this.seededTrackIds.push(typeof state.track?.id === "number" ? state.track.id : null);
    return { authorityId: "host-authority", sessionId: `seed-${this.seededTrackIds.length}` };
  }

  start(state: PlaybackSessionState) {
    this.seededTrackIds.push(typeof state.track?.id === "number" ? state.track.id : null);
    return { authorityId: "host-authority", sessionId: "started" };
  }

  stop(): void {}
}

class TestControlPort implements PlaybackHostControlPort {
  onMessage(): () => void {
    return () => undefined;
  }

  postMessage(): void {}
}

describe("Host Runtime transactional production adapter", () => {
  test("restores the prior Authority and atomic Player/Time projection when next source preparation fails", async () => {
    const fixture = await createFixture({ failTrackId: trackB.id });
    await fixture.controller.handlePayload(command(seed(1)));

    expect(await fixture.controller.handleNext()).toBeFalse();

    expect(fixture.controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 0 }, revision: 1 },
    });
    expect(fixture.authority.seededTrackIds).toEqual([null, trackA.id, trackB.id, trackA.id]);
    expect(fixture.transactions.at(-1)).toMatchObject({
      player: { currentTrack: { id: trackA.id }, sourceUrl: `https://cdn.test/${trackA.id}.mp3` },
      time: { totalTimeMs: trackA.durationMs },
    });
  });

  test("restores the prior Authority and projection when the candidate play command is rejected", async () => {
    const fixture = await createFixture();
    await fixture.controller.handlePayload(command(seed(1)));
    fixture.authority.dispatchStatus = "rejected";

    expect(await fixture.controller.handleNext()).toBeFalse();

    expect(fixture.controller.sessionSnapshot()).toMatchObject({
      session: { queue: { queueIndex: 0 }, revision: 1 },
    });
    expect(fixture.authority.seededTrackIds).toEqual([null, trackA.id, trackB.id, trackA.id]);
    expect(fixture.transactions.at(-1)).toMatchObject({
      player: { currentTrack: { id: trackA.id }, sourceUrl: `https://cdn.test/${trackA.id}.mp3` },
    });
  });

  test("clear cancels the real catalog adapter so a late source cannot revive its projection", async () => {
    const deferredSource = createDeferred<{
      durationMs: number;
      lyrics: null;
      sourceUrl: string;
    }>();
    const transactions: PlaybackHostMediaProjectionTransaction[] = [];
    const projection = createPlaybackHostMediaProjection({
      apply(transaction) {
        transactions.push(transaction);
      },
    });
    const authority = new TestAuthority();
    const runtime = createPlaybackRuntime({
      authority,
      catalog: createPlaybackCatalogPort({
        applyResolvedSource: (input) => projection.applyCatalogResolvedSource(input),
        resolve: () => deferredSource.promise,
      }),
      featurePublisher: { setIdentity: () => undefined },
      queue: { next: () => null, previous: () => null },
    });
    const session = runtimeSession(trackA, 1, "play");
    await runtime.start(idleSession());
    projection.applyRuntimeSession({ intent: "play", quality: "high", session });
    await runtime.seedSession(session);

    const pending = runtime.ensureSource();
    await Promise.resolve();
    await runtime.clearSession();
    projection.clear();
    deferredSource.resolve({
      durationMs: trackA.durationMs,
      lyrics: null,
      sourceUrl: "https://cdn.test/late.mp3",
    });

    await expect(pending).resolves.toBe("superseded");
    expect(projection.currentSessionKey()).toBeNull();
    expect(transactions).toHaveLength(1);
  });
});

async function createFixture(input: { failTrackId?: number } = {}) {
  const authority = new TestAuthority();
  const transactions: PlaybackHostMediaProjectionTransaction[] = [];
  const projection = createPlaybackHostMediaProjection({
    apply(transaction) {
      transactions.push(transaction);
    },
  });
  const metadata = new Map<string, { intent: "pause" | "play"; quality: "high" }>();
  const coreRef: { current: ReturnType<typeof createPlaybackRuntime> | null } = { current: null };

  const controller = createPlaybackHostSessionController({
    catalog: catalog(metadata),
    createRuntime(queue) {
      return createAdapter({
        authority,
        failTrackId: input.failTrackId,
        metadata,
        projection,
        queue,
        setCore(value) {
          coreRef.current = value;
        },
      });
    },
    port: new TestControlPort(),
  });
  const core = coreRef.current;
  if (!core) throw new Error("Expected the controller to construct its Runtime adapter.");
  await core.start(idleSession());
  return { authority, controller, transactions };
}

function createAdapter(input: {
  authority: TestAuthority;
  failTrackId?: number;
  metadata: Map<string, { intent: "pause" | "play"; quality: "high" }>;
  projection: ReturnType<typeof createPlaybackHostMediaProjection>;
  queue: PlaybackHostSessionQueue;
  setCore(core: ReturnType<typeof createPlaybackRuntime>): void;
}): PlaybackHostSessionRuntimePort {
  const catalog = createPlaybackCatalogPort({
    applyResolvedSource: (source) => input.projection.applyCatalogResolvedSource(source),
    async resolve({ request }) {
      const trackId = request.session.state.track?.id;
      if (trackId === input.failTrackId) throw new Error("candidate-source-failed");
      return {
        durationMs: request.session.state.durationMs,
        lyrics: null,
        sourceUrl: `https://cdn.test/${trackId}.mp3`,
      };
    },
  });
  const core = createPlaybackRuntime({
    authority: input.authority,
    catalog,
    featurePublisher: { setIdentity: () => undefined },
    queue: input.queue,
  });
  input.setCore(core);

  const seedSession = async (session: PlaybackRuntimeSession) => {
    const metadata = input.metadata.get(session.key);
    if (!metadata) throw new Error("missing-session-metadata");
    if (!input.projection.applyRuntimeSession({ ...metadata, session })) {
      throw new Error("projection-rejected-runtime-session");
    }
    return core.seedSession(session);
  };
  return {
    advanceOnEnded: async () => {
      const session = input.queue.next("ended");
      if (!session) return false;
      await seedSession(session);
      return true;
    },
    captureCheckpoint: () => {
      const runtimeCheckpoint = core.checkpoint();
      const projectionCheckpoint = input.projection.checkpoint();
      return {
        rollback: async () => {
          try {
            await core.restore(runtimeCheckpoint);
          } finally {
            input.projection.restore(projectionCheckpoint);
          }
        },
      };
    },
    clearSession: async () => {
      await core.clearSession();
      input.projection.clear();
    },
    dispatch: (control) => core.dispatch(control),
    ensureSource: () => core.ensureSource(),
    seedSession,
  };
}

function catalog(
  metadata: Map<string, { intent: "pause" | "play"; quality: "high" }>,
): PlaybackHostSessionCatalog {
  return {
    createRuntimeSession({
      entry: queueEntry,
      intent,
      positionMs,
      reason,
      sourceLoadRevision,
      volume,
    }) {
      const session = runtimeSession(
        queueEntry,
        sourceLoadRevision,
        intent,
        positionMs,
        reason,
        volume,
      );
      metadata.set(session.key, { intent, quality: "high" });
      return session;
    },
  };
}

function runtimeSession(
  queueEntry: PlaybackQueueEntry,
  sourceLoadRevision: number,
  intent: "pause" | "play",
  positionMs = 0,
  reason: "resume" | "track-change" = "track-change",
  volume = 0.6,
): PlaybackRuntimeSession {
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
}

function idleSession(): PlaybackRuntimeSession {
  return {
    key: "idle",
    sourceLoadRevision: 0,
    state: {
      canControl: false,
      durationMs: 0,
      liked: false,
      lyrics: null,
      lyricsVersion: null,
      phase: "idle",
      track: null,
      volume: 60,
    },
  };
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

function seed(revision: number): PlaybackSessionSeed {
  return {
    intent: "play",
    quality: "high",
    queue: {
      historyIndex: 0,
      historyStack: [0],
      originalQueue: [trackA, trackB],
      playlistId: null,
      queue: [trackA, trackB],
      queueIndex: 0,
      repeatMode: "off",
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

function createDeferred<T>() {
  let resolvePromise: ((value: T) => void) | null = null;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve(value: T) {
      if (!resolvePromise) throw new Error("Expected the deferred source to be initialized.");
      resolvePromise(value);
    },
  };
}
