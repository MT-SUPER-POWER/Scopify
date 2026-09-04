import { describe, expect, test } from "bun:test";
import {
  createPlaybackSession,
  type AudioEngineAdapter,
  type AudioEngineEvent,
  type AudioEngineLoadOptions,
  type AudioEngineLoadResult,
  type AudioEngineSnapshot,
  type PlayableSource,
  type PlaybackQueueItem,
  type SourceResolveRequest,
  type SourceResolution,
} from "../src";

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

class FakeAudioEngine implements AudioEngineAdapter {
  private listeners = new Set<(event: AudioEngineEvent) => void>();
  lastLoadedSource: PlayableSource | null = null;
  private revision = 0;

  dispose = async () => undefined;

  getSnapshot = (): AudioEngineSnapshot => ({
    durationMs: 0,
    phase: "idle",
    playbackRate: 1,
    positionMs: 0,
    volume: 50,
  });

  load = async (
    source: PlayableSource,
    options: AudioEngineLoadOptions,
  ): Promise<AudioEngineLoadResult> => {
    this.lastLoadedSource = source;
    this.revision = options.revision;
    return { durationMs: 180_000, status: "loaded" };
  };

  pause = async () => this.emit({ revision: this.revision, type: "paused" });
  play = async () => this.emit({ revision: this.revision, type: "playing" });
  seek = async (positionMs: number) =>
    this.emit({ positionMs, revision: this.revision, sampledAtMs: 1_000, type: "position" });
  setVolume = async (volume: number) =>
    this.emit({ revision: this.revision, type: "volume", volume });
  stop = async () => this.emit({ revision: this.revision, type: "stopped" });

  subscribe(listener: (event: AudioEngineEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: AudioEngineEvent) {
    for (const listener of this.listeners) listener(event);
  }
}

function createResolver(
  resolve: (item: PlaybackQueueItem, request: SourceResolveRequest) => Promise<SourceResolution>,
) {
  return {
    invalidate: () => undefined,
    resolve,
  };
}

describe("PlaybackSession", () => {
  test("loads a stable queue item through the resolver and only exposes its public track", async () => {
    const engine = new FakeAudioEngine();
    const session = createPlaybackSession({
      audioEngine: engine,
      sourceResolver: createResolver(async (item) => ({
        source: {
          candidateId: `candidate:${item.track.id}`,
          kind: "remote",
          quality: "lossless",
          url: "https://signed.example.test/private.flac?token=secret",
        },
        status: "resolved",
      })),
    });

    await session.replaceQueue([a]);

    expect(engine.lastLoadedSource).toMatchObject({ kind: "remote" });
    expect(session.getSnapshot()).toMatchObject({
      phase: "playing",
      track: { id: "a", title: "A" },
    });
    expect(JSON.stringify(session.getSnapshot())).not.toContain("signed.example.test");
  });

  test("ignores an obsolete source resolution after the user immediately selects another item", async () => {
    const engine = new FakeAudioEngine();
    let resolveFirst!: (value: SourceResolution) => void;
    const first = new Promise<SourceResolution>((resolve) => {
      resolveFirst = resolve;
    });
    const session = createPlaybackSession({
      audioEngine: engine,
      sourceResolver: createResolver(async (item) => {
        if (item.queueItemId === a.queueItemId) return first;
        return {
          source: {
            candidateId: "candidate:b",
            kind: "remote",
            quality: "lossless",
            url: "https://cdn.example.test/b.flac",
          },
          status: "resolved",
        };
      }),
    });

    const loadingA = session.replaceQueue([a, b], { autoPlay: false });
    const loadingB = session.playQueueItem("queue-b", { autoPlay: false });
    resolveFirst({
      source: {
        candidateId: "candidate:a",
        kind: "remote",
        quality: "lossless",
        url: "https://cdn.example.test/a.flac",
      },
      status: "resolved",
    });
    await Promise.all([loadingA, loadingB]);

    expect(engine.lastLoadedSource).toMatchObject({ url: "https://cdn.example.test/b.flac" });
    expect(session.getSnapshot().track).toEqual(b.track);
  });

  test("advances once when the engine reports a duplicated ended event", async () => {
    const engine = new FakeAudioEngine();
    const session = createPlaybackSession({
      audioEngine: engine,
      sourceResolver: createResolver(async (item) => ({
        source: {
          candidateId: `candidate:${item.track.id}`,
          kind: "remote",
          quality: "lossless",
          url: `https://cdn.example.test/${item.track.id}.flac`,
        },
        status: "resolved",
      })),
    });
    await session.replaceQueue([a, b]);

    engine.emit({ revision: 1, type: "ended" });
    engine.emit({ revision: 1, type: "ended" });
    await Promise.resolve();
    await Promise.resolve();

    expect(session.getSnapshot().track).toEqual(b.track);
  });

  test("refreshes an expired audio source while preserving the current position", async () => {
    const engine = new FakeAudioEngine();
    let resolutionCount = 0;
    const session = createPlaybackSession({
      audioEngine: engine,
      sourceResolver: createResolver(async () => {
        resolutionCount += 1;
        return {
          source: {
            candidateId: `candidate:${resolutionCount}`,
            kind: "remote",
            quality: "lossless",
            url: `https://cdn.example.test/version-${resolutionCount}.flac`,
          },
          status: "resolved",
        };
      }),
    });
    await session.replaceQueue([a]);
    await session.seek(42_000);

    engine.emit({ reason: "http-expired", revision: 1, type: "source-error" });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(engine.lastLoadedSource).toMatchObject({
      url: "https://cdn.example.test/version-2.flac",
    });
    expect(session.getSnapshot()).toMatchObject({ phase: "playing", positionMs: 42_000 });
  });

  test("ignores a late engine event after the queue has been cleared", async () => {
    const engine = new FakeAudioEngine();
    const session = createPlaybackSession({
      audioEngine: engine,
      sourceResolver: createResolver(async () => ({
        source: {
          candidateId: "candidate:a",
          kind: "remote",
          quality: "lossless",
          url: "https://cdn.example.test/a.flac",
        },
        status: "resolved",
      })),
    });
    await session.replaceQueue([a]);
    await session.replaceQueue([]);

    engine.emit({ revision: 1, type: "ended" });
    await Promise.resolve();

    expect(session.getSnapshot()).toMatchObject({
      phase: "idle",
      queue: { currentItemId: null, items: [] },
      track: null,
    });
  });

  test("returns unavailable instead of calling an engine when no queue item is selected", async () => {
    const session = createPlaybackSession({
      audioEngine: new FakeAudioEngine(),
      sourceResolver: createResolver(async () => ({
        reason: "not-needed",
        retryable: false,
        status: "unavailable",
      })),
    });

    expect(await session.play()).toEqual({ reason: "no-queue-item", status: "unavailable" });
  });
});
