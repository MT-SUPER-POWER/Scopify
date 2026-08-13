import { afterAll, afterEach, describe, expect, mock, test } from "bun:test";
import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type PlaybackHostReplaceSessionCommand,
  type PlaybackQueueEntry,
  type PlaybackSessionSeed,
} from "@mt-super-power/desktop-contract";

import type { NeteaseLyric } from "@/types/api/music";

const sent: unknown[] = [];
let closedConnections = 0;
let inbound: ((payload: PlaybackHostReplaceSessionCommand) => void) | null = null;
let closeInboundControl: (() => void) | null = null;
const reportReady = mock(() => true);
const cacheRecords = new Map<string, { expiresAt: number; value: unknown }>();
const cachePreferences = {
  page: { enabled: true, maxSizeMB: 256, searchTtlMinutes: 30, ttlMinutes: 360 },
  playback: {
    enabled: true,
    lyricTtlMinutes: 1440,
    maxEntries: 100,
    maxSizeMB: 64,
    urlTtlMinutes: 30,
  },
};

const cache = {
  clear: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
  clearSelected: async () => ({
    page: {
      categories: [],
      dir: "cache/page",
      enabled: true,
      entryCount: 0,
      maxSizeMB: 256,
      scope: "page",
      sizeBytes: 0,
    },
    playback: {
      categories: [],
      dir: "cache/playback",
      enabled: true,
      entryCount: 0,
      maxSizeMB: 64,
      scope: "playback",
      sizeBytes: 0,
    },
    rootDir: "cache",
  }),
  delete: async (key: string) => {
    cacheRecords.delete(`page:${key}`);
  },
  deleteScoped: async (scope: string, key: string) => {
    cacheRecords.delete(`${scope}:${key}`);
  },
  get: async <T>(key: string) => cache.getScoped<T>("page", key),
  getPreferences: async () => cachePreferences,
  getScoped: async <T>(scope: string, key: string) => {
    const record = cacheRecords.get(`${scope}:${key}`);
    if (!record || record.expiresAt <= Date.now()) {
      cacheRecords.delete(`${scope}:${key}`);
      return null;
    }
    return record.value as T;
  },
  savePreferences: async (preferences: typeof cachePreferences) => preferences,
  set: async <T>(key: string, value: T, ttlMs: number) =>
    cache.setScoped("page", key, value, ttlMs),
  setScoped: async <T>(scope: string, key: string, value: T, ttlMs: number) => {
    cacheRecords.set(`${scope}:${key}`, { expiresAt: Date.now() + ttlMs, value });
  },
  stats: async () => ({ dir: "cache", entryCount: 0, sizeBytes: 0 }),
  statsAll: async () => ({
    page: {
      categories: [],
      dir: "cache/page",
      enabled: true,
      entryCount: 0,
      maxSizeMB: 256,
      scope: "page",
      sizeBytes: 0,
    },
    playback: {
      categories: [],
      dir: "cache/playback",
      enabled: true,
      entryCount: 0,
      maxSizeMB: 64,
      scope: "playback",
      sizeBytes: 0,
    },
    rootDir: "cache",
  }),
};

mock.module("@/lib/runtime", () => ({
  runtime: {
    cache,
    playbackHost: {
      getNonce: () => "test-host-nonce",
      reportReady,
    },
    playbackHostControl: {
      connectHost: (
        _connectionId: string,
        receive: (payload: PlaybackHostReplaceSessionCommand) => void,
        onClose: () => void,
      ) => {
        inbound = receive;
        closeInboundControl = onClose;
        return {
          close: () => {
            closedConnections += 1;
          },
          send: (payload: unknown) => {
            sent.push(payload);
            return true;
          },
        };
      },
    },
  },
}));

mock.module("@/lib/playbackHost/neteaseCatalog", () => ({
  createNeteasePlaybackCatalog: () => ({
    resolve: async () => ({
      durationMs: 180_000,
      lyrics: { code: 200, lrc: { lyric: "runtime lyric", version: 1 } } as NeteaseLyric,
      sourceUrl: "https://cdn.example.test/runtime.mp3",
    }),
  }),
  createPlaybackCatalogPort: (options: {
    applyResolvedSource(input: {
      isCurrent: () => boolean;
      request: unknown;
      resolved: { durationMs: number; lyrics: NeteaseLyric; sourceUrl: string };
      signal: AbortSignal;
    }): boolean;
    resolve(input: { request: unknown; signal: AbortSignal }): Promise<{
      durationMs: number;
      lyrics: NeteaseLyric;
      sourceUrl: string;
    }>;
  }) => ({
    ensureSource: async (request: unknown) => {
      const controller = new AbortController();
      const resolved = await options.resolve({ request, signal: controller.signal });
      return options.applyResolvedSource({
        isCurrent: () => true,
        request,
        resolved,
        signal: controller.signal,
      });
    },
  }),
}));

const { createPlaybackHostSessionRuntime } = await import("@/lib/playbackHost/hostSessionRuntime");
const { usePlayerStore } = await import("@/store/module/player");
const { useTimeStore } = await import("@/store/module/time");

afterAll(() => mock.restore());

afterEach(() => {
  usePlayerStore.getState().cleanCache();
  useTimeStore.setState({ bufferedTime: 0, currentTime: 0, totalTime: 0 });
});

describe("PlaybackHostSessionRuntime", () => {
  test("binds an already-empty Authority, then projects the Host-controlled media transaction", async () => {
    sent.length = 0;
    closedConnections = 0;
    inbound = null;
    closeInboundControl = null;
    reportReady.mockClear();

    const authority = createAuthority();
    const host = createPlaybackHostSessionRuntime();
    host.resetProjection();
    host.bindAuthority(authority as never);
    await flush();

    // The React provider has already opened the Authority with its stable empty
    // session. The Host runtime must not manufacture a second media session
    // merely to connect the control channel.
    expect(authority.beginSession).not.toHaveBeenCalled();
    expect(inbound).toBeTypeOf("function");
    expect(reportReady).toHaveBeenCalledWith("test-host-nonce");

    expect(inbound).toBeTypeOf("function");
    const deliver = inbound as unknown as (payload: PlaybackHostReplaceSessionCommand) => void;
    deliver(seed(1, [entry(7, "Runtime Song")], 45_000));
    await flush();

    expect(authority.beginSession).toHaveBeenCalledWith(
      expect.objectContaining({ track: expect.objectContaining({ id: 7 }) }),
      expect.objectContaining({ positionMs: 45_000, reason: "resume" }),
    );
    expect(authority.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        lyrics: expect.objectContaining({
          raw: expect.objectContaining({
            lrc: expect.objectContaining({ lyric: "runtime lyric" }),
          }),
          source: "lrc",
        }),
        lyricsVersion: expect.any(String),
      }),
    );
    expect(authority.updateState).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState()).toMatchObject({
      currentSongDetail: { id: 7, name: "Runtime Song" },
      currentSongUrl: "https://cdn.example.test/runtime.mp3",
      isPlaying: true,
      playbackSessionRevision: 1,
    });
    expect(useTimeStore.getState()).toMatchObject({ currentTime: 45_000, totalTime: 180_000 });
    expect(sent).toContainEqual(
      expect.objectContaining({ status: "applied", type: "command-receipt" }),
    );
    expect(sent).toContainEqual(
      expect.objectContaining({
        session: expect.objectContaining({ revision: 1 }),
        type: "session-snapshot",
      }),
    );

    deliver(seed(2, []));
    await flush();

    expect(usePlayerStore.getState()).toMatchObject({
      currentSongDetail: null,
      currentSongUrl: null,
      isPlaying: false,
    });
    expect(sent).toContainEqual(
      expect.objectContaining({
        session: expect.objectContaining({ revision: 2 }),
        type: "session-snapshot",
      }),
    );

    const messagesBeforeDispose = sent.length;
    host.dispose();
    expect(closedConnections).toBe(1);

    deliver(seed(3, [entry(8, "Late Song")]));
    await flush();

    expect(sent).toHaveLength(messagesBeforeDispose);
    expect(usePlayerStore.getState()).toMatchObject({
      currentSongDetail: null,
      currentSongUrl: null,
    });
  });

  test("checkpoints the Host timeline at a coarse cadence and clears its timer on dispose", async () => {
    sent.length = 0;
    inbound = null;
    const scheduler = new ManualIntervalScheduler();
    const host = createPlaybackHostSessionRuntime({ scheduler });
    host.bindAuthority(createAuthority() as never);
    await flush();

    expect(scheduler.intervals).toEqual([5_000]);
    const deliver = inbound as unknown as (payload: PlaybackHostReplaceSessionCommand) => void;
    deliver(seed(1, [entry(8, "Checkpoint Song")]));
    await flush();
    useTimeStore.getState().setCurrentTime(12_345);

    scheduler.fire();
    await flush();

    expect(sent).toContainEqual(
      expect.objectContaining({
        session: expect.objectContaining({ resumePositionMs: 12_345, revision: 2 }),
        type: "session-snapshot",
      }),
    );
    host.dispose();
    expect(scheduler.cleared).toBe(1);
  });

  test("publishes cached lyrics again when repeat-all starts the same track as a new session", async () => {
    sent.length = 0;
    inbound = null;
    const authority = createAuthority();
    const host = createPlaybackHostSessionRuntime();
    host.bindAuthority(authority as never);
    await flush();

    const deliver = inbound as unknown as (payload: PlaybackHostReplaceSessionCommand) => void;
    deliver(seed(1, [entry(9, "Repeat Song")], 0, "all"));
    await flush();

    await host.externalSessionControl.onEnded?.();
    await flush();

    expect(authority.beginSession).toHaveBeenLastCalledWith(
      expect.objectContaining({ track: expect.objectContaining({ id: 9 }) }),
      expect.objectContaining({ reason: "track-change" }),
    );
    expect(authority.updateState).toHaveBeenCalledTimes(2);
    expect(authority.updateState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lyrics: expect.objectContaining({
          raw: expect.objectContaining({
            lrc: expect.objectContaining({ lyric: "runtime lyric" }),
          }),
        }),
        lyricsVersion: expect.any(String),
      }),
    );
    host.dispose();
  });

  test("releases the Authority next command before the Host dispatches replacement play", async () => {
    sent.length = 0;
    inbound = null;
    const authority = createAuthority();
    const host = createPlaybackHostSessionRuntime();
    host.bindAuthority(authority as never);
    await flush();

    const deliver = inbound as unknown as (payload: PlaybackHostReplaceSessionCommand) => void;
    deliver(seed(1, [entry(21, "First"), entry(22, "Second")]));
    await flush();

    // This callback runs from PlaybackAuthority.dispatch({ type: "next" }).
    // It must return before the Host's nested `play` can use that same command
    // tail; otherwise the two commands wait on each other forever.
    expect(host.externalSessionControl.next?.()).toBeUndefined();
    await flush();

    expect(authority.beginSession).toHaveBeenLastCalledWith(
      expect.objectContaining({ track: expect.objectContaining({ id: 22 }) }),
      expect.objectContaining({ reason: "track-change" }),
    );
    expect(authority.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: "play" }));
    host.dispose();
  });

  test("reconnects a closed Host control port without letting an old close callback disturb it", async () => {
    sent.length = 0;
    inbound = null;
    closeInboundControl = null;
    const controlTimer = new ManualTimeoutScheduler();
    const host = createPlaybackHostSessionRuntime({ controlReconnectTimer: controlTimer });
    host.bindAuthority(createAuthority() as never);
    await flush();

    const retiredInbound = inbound as unknown as (
      payload: PlaybackHostReplaceSessionCommand,
    ) => void;
    const retiredClose = closeInboundControl as unknown as () => void;
    retiredClose();
    expect(controlTimer.delays).toEqual([250]);
    controlTimer.fire();

    const activeInbound = inbound as unknown as (
      payload: PlaybackHostReplaceSessionCommand,
    ) => void;
    expect(activeInbound).not.toBe(retiredInbound);
    activeInbound(seed(1, [entry(15, "Reconnected Song")]));
    await flush();
    expect(usePlayerStore.getState().currentSongDetail).toMatchObject({ id: 15 });

    retiredClose();
    expect(controlTimer.delays).toEqual([250]);
    host.dispose();
  });
});

class ManualIntervalScheduler {
  readonly intervals: number[] = [];
  cleared = 0;
  private callback: (() => void) | null = null;

  clearInterval(handle: unknown): void {
    if (handle === this.callback) this.cleared += 1;
    this.callback = null;
  }

  setInterval(callback: () => void, intervalMs: number): unknown {
    this.callback = callback;
    this.intervals.push(intervalMs);
    return callback;
  }

  fire(): void {
    this.callback?.();
  }
}

class ManualTimeoutScheduler {
  readonly delays: number[] = [];
  private callback: (() => void) | null = null;

  clearTimeout(handle: unknown): void {
    if (handle === this.callback) this.callback = null;
  }

  setTimeout(callback: () => void, intervalMs: number): unknown {
    this.callback = callback;
    this.delays.push(intervalMs);
    return callback;
  }

  fire(): void {
    const callback = this.callback;
    this.callback = null;
    callback?.();
  }
}

function createAuthority() {
  const identity = { authorityId: "host-authority", sessionId: "host-empty-session" };
  return {
    beginSession: mock(() => undefined),
    currentIdentity: identity,
    dispatch: mock(async (command: { commandId: string }) => ({
      commandId: command.commandId,
      status: "accepted" as const,
    })),
    updateState: mock(() => undefined),
  };
}

function entry(id: number, title: string): PlaybackQueueEntry {
  return {
    album: { artworkUrl: `https://img.example.test/${id}`, id, title: `${title} Album` },
    artists: [{ id, name: "Runtime Artist" }],
    durationMs: 180_000,
    fee: 0,
    id,
    publishTime: 0,
    title,
  };
}

function seed(
  revision: number,
  queue: PlaybackQueueEntry[],
  resumePositionMs = 0,
  repeatMode: PlaybackSessionSeed["queue"]["repeatMode"] = "off",
): PlaybackHostReplaceSessionCommand {
  const empty = queue.length === 0;
  const session: PlaybackSessionSeed = {
    intent: "play",
    quality: "high",
    queue: {
      historyIndex: empty ? -1 : 0,
      historyStack: empty ? [] : [0],
      originalQueue: queue,
      playlistId: null,
      queue,
      queueIndex: empty ? -1 : 0,
      repeatMode,
      shuffleEnabled: false,
    },
    resumePositionMs,
    revision,
    volume: 0.6,
  };
  return {
    commandId: `runtime-${revision}`,
    protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
    session,
    type: "replace-session",
  };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
