import { describe, expect, test } from "bun:test";

import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackSessionState,
} from "@scopifymusicplayer/desktop-contract";

import type {
  PlaybackCatalogPort,
  PlaybackQueuePort,
  PlaybackRuntimeSession,
} from "@/lib/playbackHost/catalog";
import type {
  PlaybackFeatureIdentity,
  PlaybackFeaturePublisher,
} from "@/lib/playbackHost/audioFeatureSampler";
import {
  createPlaybackRuntime,
  type PlaybackRuntimeAuthorityPort,
} from "@/lib/playbackHost/runtime";

class FakeAuthority implements PlaybackRuntimeAuthorityPort {
  readonly dispatched: PlaybackCommand[] = [];
  readonly seeded: Array<{
    options: { positionMs: number; reason: "replay" | "resume" | "track-change" };
    state: PlaybackSessionState;
  }> = [];
  readonly started: PlaybackSessionState[] = [];
  stopped = 0;

  constructor(
    private readonly startIdentity: PlaybackFeatureIdentity,
    private readonly seededIdentity: PlaybackFeatureIdentity,
  ) {}

  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    this.dispatched.push(command);
    return Promise.resolve({ commandId: command.commandId, status: "accepted" });
  }

  seedSession(
    state: PlaybackSessionState,
    options: { positionMs: number; reason: "replay" | "resume" | "track-change" },
  ): PlaybackFeatureIdentity {
    this.seeded.push({ options, state });
    return this.seededIdentity;
  }

  start(state: PlaybackSessionState): PlaybackFeatureIdentity {
    this.started.push(state);
    return this.startIdentity;
  }

  stop(): void {
    this.stopped += 1;
  }
}

class FakeFeaturePublisher implements PlaybackFeaturePublisher {
  readonly identities: Array<PlaybackFeatureIdentity | null> = [];
  stopped = 0;

  setIdentity(identity: PlaybackFeatureIdentity | null): void {
    this.identities.push(identity ? { ...identity } : null);
  }

  stop(): void {
    this.stopped += 1;
  }
}

function createSession(
  key: string,
  sourceLoadRevision: number,
  overrides: Partial<PlaybackRuntimeSession> = {},
): PlaybackRuntimeSession {
  return {
    key,
    sourceLoadRevision,
    state: {
      canControl: true,
      durationMs: 180_000,
      liked: false,
      lyrics: null,
      lyricsVersion: null,
      phase: "paused",
      track: {
        albumTitle: "Album",
        artistNames: ["Artist"],
        artworkUrl: "https://example.test/artwork.jpg",
        id: key,
        title: key,
      },
      volume: 70,
    },
    ...overrides,
  };
}

function createQueue(): PlaybackQueuePort {
  return {
    next: () => null,
    previous: () => null,
  };
}

describe("PlaybackRuntime", () => {
  test("supersedes an old asynchronous source load before it reaches Authority", async () => {
    let resolveOldLoad: ((ready: boolean) => void) | undefined;
    const catalog: PlaybackCatalogPort = {
      ensureSource: () =>
        new Promise<boolean>((resolve) => {
          resolveOldLoad = resolve;
        }),
    };
    const authority = new FakeAuthority(
      { authorityId: "authority-a", sessionId: "session-a" },
      { authorityId: "authority-a", sessionId: "session-b" },
    );
    const runtime = createPlaybackRuntime({
      authority,
      catalog,
      featurePublisher: new FakeFeaturePublisher(),
      queue: createQueue(),
    });

    await runtime.start(createSession("track-a", 10));
    const play = runtime.dispatch({ commandId: "play-a", type: "play" });
    await runtime.seedSession(createSession("track-b", 11));
    resolveOldLoad?.(true);

    await expect(play).resolves.toEqual({
      commandId: "play-a",
      reason: "playback-source-superseded",
      status: "unavailable",
    });
    expect(authority.dispatched).toEqual([]);
  });

  test("seeds Authority with the selected session position and reason", async () => {
    const authority = new FakeAuthority(
      { authorityId: "authority-a", sessionId: "session-a" },
      { authorityId: "authority-a", sessionId: "session-b" },
    );
    const runtime = createPlaybackRuntime({
      authority,
      catalog: { ensureSource: () => true },
      featurePublisher: new FakeFeaturePublisher(),
      queue: createQueue(),
    });
    const initial = createSession("track-a", 1);
    const resumed = createSession("track-b", 2, {
      positionMs: 4_200,
      reason: "resume",
    });

    await runtime.start(initial);
    await runtime.seedSession(resumed);

    expect(authority.started).toEqual([initial.state]);
    expect(authority.seeded).toEqual([
      {
        options: { positionMs: 4_200, reason: "resume" },
        state: resumed.state,
      },
    ]);
  });

  test("switches feature identity on a new session and clears it during stop", async () => {
    const featurePublisher = new FakeFeaturePublisher();
    const runtime = createPlaybackRuntime({
      authority: new FakeAuthority(
        { authorityId: "authority-a", sessionId: "session-a" },
        { authorityId: "authority-a", sessionId: "session-b" },
      ),
      catalog: { ensureSource: () => true },
      featurePublisher,
      queue: createQueue(),
    });

    await runtime.start(createSession("track-a", 1));
    await runtime.seedSession(createSession("track-b", 2));
    runtime.stop();

    expect(featurePublisher.identities).toEqual([
      { authorityId: "authority-a", sessionId: "session-a" },
      { authorityId: "authority-a", sessionId: "session-b" },
      null,
    ]);
    expect(featurePublisher.stopped).toBe(1);
  });

  test("keeps Authority alive with an idle session when the Host queue becomes empty", async () => {
    const authority = new FakeAuthority(
      { authorityId: "authority-a", sessionId: "session-a" },
      { authorityId: "authority-a", sessionId: "session-b" },
    );
    const featurePublisher = new FakeFeaturePublisher();
    const runtime = createPlaybackRuntime({
      authority,
      catalog: { ensureSource: () => true },
      featurePublisher,
      queue: createQueue(),
    });

    await runtime.start(createSession("track-a", 1));
    await runtime.clearSession();

    expect(authority.stopped).toBe(0);
    expect(authority.seeded).toEqual([
      {
        options: { positionMs: 0, reason: "track-change" },
        state: {
          canControl: false,
          durationMs: 0,
          liked: false,
          lyrics: null,
          lyricsVersion: null,
          phase: "idle",
          track: null,
          volume: 70,
        },
      },
    ]);
    await expect(runtime.ensureSource()).resolves.toBe("failed");
    expect(featurePublisher.identities.at(-1)).toBeNull();

    await runtime.seedSession(createSession("track-b", 2));

    expect(authority.seeded.at(-1)?.state.track?.id).toBe("track-b");
    expect(featurePublisher.identities.at(-1)).toEqual({
      authorityId: "authority-a",
      sessionId: "session-b",
    });
  });

  test("cancels the catalog before session replacement, clear, and stop", async () => {
    let cancellations = 0;
    const runtime = createPlaybackRuntime({
      authority: new FakeAuthority(
        { authorityId: "authority-a", sessionId: "session-a" },
        { authorityId: "authority-a", sessionId: "session-b" },
      ),
      catalog: {
        cancelSource: () => {
          cancellations += 1;
        },
        ensureSource: () => true,
      },
      featurePublisher: new FakeFeaturePublisher(),
      queue: createQueue(),
    });

    await runtime.start(createSession("track-a", 1));
    await runtime.seedSession(createSession("track-b", 2));
    await runtime.clearSession();
    runtime.stop();

    expect(cancellations).toBe(3);
  });

  test("invalidates the current source before retrying it through a newer load epoch", async () => {
    const calls: string[] = [];
    const runtime = createPlaybackRuntime({
      authority: new FakeAuthority(
        { authorityId: "authority-a", sessionId: "session-a" },
        { authorityId: "authority-a", sessionId: "session-b" },
      ),
      catalog: {
        ensureSource: (request) => {
          calls.push(`ensure:${request.loadEpoch}`);
          return true;
        },
        invalidateSource: (request) => {
          calls.push(`invalidate:${request.loadEpoch}`);
        },
      },
      featurePublisher: new FakeFeaturePublisher(),
      queue: createQueue(),
    });

    await runtime.start(createSession("track-a", 1));

    await expect(runtime.refreshSource()).resolves.toBe("ready");
    expect(calls).toEqual(["invalidate:2", "ensure:3"]);
  });

  test("invalidates an in-flight source load and releases all owned resources on stop", async () => {
    let resolveSource: ((ready: boolean) => void) | undefined;
    const authority = new FakeAuthority(
      { authorityId: "authority-a", sessionId: "session-a" },
      { authorityId: "authority-a", sessionId: "session-b" },
    );
    const featurePublisher = new FakeFeaturePublisher();
    const runtime = createPlaybackRuntime({
      authority,
      catalog: {
        ensureSource: () =>
          new Promise<boolean>((resolve) => {
            resolveSource = resolve;
          }),
      },
      featurePublisher,
      queue: createQueue(),
    });

    await runtime.start(createSession("track-a", 1));
    const source = runtime.ensureSource();
    runtime.stop();
    resolveSource?.(true);

    await expect(source).resolves.toBe("superseded");
    expect(authority.stopped).toBe(1);
    expect(featurePublisher.identities.at(-1)).toBeNull();
    expect(featurePublisher.stopped).toBe(1);
  });
});
