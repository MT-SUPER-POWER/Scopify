import { describe, expect, test } from "bun:test";

import type { PlaybackCommand, PlaybackSessionState } from "@scopify/desktop-contract";

import {
  createDeferredPlaybackHostAuthorityPort,
  createPlaybackHostEndedHandler,
  createPlaybackHostMediaProjection,
} from "@/lib/playbackHost/hostMediaProjection";
import type {
  PlaybackHostAuthorityBinding,
  PlaybackHostMediaProjectionTransaction,
} from "@/types/playbackHostMediaProjection";

interface TestLyric {
  text: string;
}

function session(
  key: string,
  sourceLoadRevision: number,
  overrides: Partial<PlaybackSessionState<TestLyric>> = {},
) {
  return {
    key,
    positionMs: 12_000,
    reason: "resume" as const,
    sourceLoadRevision,
    state: {
      canControl: true,
      durationMs: 180_000,
      liked: false,
      lyrics: { text: "seed lyric" },
      lyricsVersion: 1,
      phase: "loading" as const,
      track: {
        albumTitle: "Album",
        artistNames: ["Artist"],
        artworkUrl: "https://example.test/cover.jpg",
        id: 1,
        title: "Track",
      },
      volume: 64,
      ...overrides,
    },
  };
}

function input(key = "session-a", revision = 1) {
  return {
    intent: "play" as const,
    quality: "lossless" as const,
    session: session(key, revision),
  };
}

describe("PlaybackHostMediaProjectionService", () => {
  test("maps a Runtime session to one atomic Player/Time transaction", () => {
    const transactions: PlaybackHostMediaProjectionTransaction<TestLyric>[] = [];
    const projection = createPlaybackHostMediaProjection<TestLyric>({
      apply(transaction) {
        transactions.push(transaction);
      },
    });

    expect(projection.applyRuntimeSession(input())).toBeTrue();
    expect(transactions).toEqual([
      {
        player: {
          currentTrack: {
            albumTitle: "Album",
            artistNames: ["Artist"],
            artworkUrl: "https://example.test/cover.jpg",
            id: 1,
            title: "Track",
          },
          durationMs: 180_000,
          intent: "play",
          lyrics: { text: "seed lyric" },
          phase: "loading",
          quality: "lossless",
          sessionKey: "session-a",
          sourceLoadRevision: 1,
          sourceUrl: null,
          volume: 64,
        },
        time: { positionMs: 12_000, totalTimeMs: 180_000 },
      },
    ]);
  });

  test("rejects stale source revisions and equal revisions belonging to another session key", () => {
    const transactions: PlaybackHostMediaProjectionTransaction<TestLyric>[] = [];
    const projection = createPlaybackHostMediaProjection<TestLyric>({
      apply(transaction) {
        transactions.push(transaction);
      },
    });

    expect(projection.applyRuntimeSession(input("new", 4))).toBeTrue();
    expect(projection.applyRuntimeSession(input("old", 3))).toBeFalse();
    expect(projection.applyRuntimeSession(input("different", 4))).toBeFalse();
    expect(projection.currentSessionKey()).toBe("new");
    expect(projection.currentSourceLoadRevision()).toBe(4);
    expect(transactions).toHaveLength(1);
  });

  test("commits matching resolved material together and refuses stale or cancelled source results", () => {
    const transactions: PlaybackHostMediaProjectionTransaction<TestLyric>[] = [];
    const projection = createPlaybackHostMediaProjection<TestLyric>({
      apply(transaction) {
        transactions.push(transaction);
      },
    });
    const active = input("current", 7);
    projection.applyRuntimeSession(active);

    const request = { loadEpoch: 9, session: active.session, sourceLoadRevision: 7 };
    expect(
      projection.applyResolvedSource({
        request,
        resolved: {
          durationMs: 181_000,
          lyrics: { text: "resolved lyric" },
          sourceUrl: "https://example.test/current.mp3",
        },
      }),
    ).toBeTrue();
    expect(transactions.at(-1)).toMatchObject({
      player: {
        durationMs: 181_000,
        lyrics: { text: "resolved lyric" },
        sourceLoadRevision: 7,
        sourceUrl: "https://example.test/current.mp3",
      },
      time: { positionMs: 12_000, totalTimeMs: 181_000 },
    });

    expect(
      projection.applyResolvedSource({
        isCurrent: () => false,
        request,
        resolved: {
          durationMs: 1,
          lyrics: { text: "late" },
          sourceUrl: "https://example.test/late.mp3",
        },
      }),
    ).toBeFalse();
    expect(
      projection.applyResolvedSource({
        request: {
          ...request,
          sourceLoadRevision: 6,
          session: session("current", 6),
        },
        resolved: {
          durationMs: 1,
          lyrics: { text: "stale" },
          sourceUrl: "https://example.test/stale.mp3",
        },
      }),
    ).toBeFalse();
    expect(transactions).toHaveLength(2);
  });

  test("restores the complete last committed projection and clears stale-source admission", () => {
    const transactions: PlaybackHostMediaProjectionTransaction<TestLyric>[] = [];
    const projection = createPlaybackHostMediaProjection<TestLyric>({
      apply(transaction) {
        transactions.push(transaction);
      },
    });
    const previous = input("previous", 3);
    projection.applyRuntimeSession(previous);
    projection.applyResolvedSource({
      request: { loadEpoch: 1, session: previous.session, sourceLoadRevision: 3 },
      resolved: {
        durationMs: 181_000,
        lyrics: { text: "previous resolved lyric" },
        sourceUrl: "https://example.test/previous.mp3",
      },
    });
    const checkpoint = projection.checkpoint();

    projection.applyRuntimeSession(input("candidate", 4));
    projection.restore(checkpoint);

    expect(transactions.at(-1)).toMatchObject({
      player: {
        currentTrack: { id: 1 },
        durationMs: 181_000,
        lyrics: { text: "previous resolved lyric" },
        sourceUrl: "https://example.test/previous.mp3",
      },
      time: { totalTimeMs: 181_000 },
    });
    projection.clear();
    expect(
      projection.applyResolvedSource({
        request: { loadEpoch: 2, session: previous.session, sourceLoadRevision: 3 },
        resolved: {
          durationMs: 1,
          lyrics: { text: "late" },
          sourceUrl: "https://example.test/late.mp3",
        },
      }),
    ).toBeFalse();
  });
});

describe("DeferredPlaybackHostAuthorityPort", () => {
  test("is safe before React Authority binds, then forwards the complete controller surface", async () => {
    const proxy = createDeferredPlaybackHostAuthorityPort<TestLyric>();
    const command: PlaybackCommand = { commandId: "play-1", type: "play" };

    await expect(proxy.dispatch(command)).resolves.toEqual({
      commandId: "play-1",
      reason: "playback-host-authority-not-bound",
      status: "unavailable",
    });
    await expect(proxy.ensureSource()).resolves.toBe("failed");
    await expect(proxy.start(session("unbound", 1).state)).rejects.toThrow("not bound");
    expect(proxy.isBound()).toBeFalse();

    const calls: string[] = [];
    const binding: PlaybackHostAuthorityBinding<TestLyric> = {
      dispatch: async (received) => {
        calls.push(`dispatch:${received.type}`);
        return { commandId: received.commandId, status: "accepted" };
      },
      ensureSource: async () => {
        calls.push("ensureSource");
        return "ready" as const;
      },
      seedSession: async (_state, options) => {
        calls.push(`seed:${options.reason}:${options.positionMs}`);
        return { authorityId: "authority", sessionId: "session" };
      },
      start: async () => {
        calls.push("start");
        return { authorityId: "authority", sessionId: "session" };
      },
      stop: () => {
        calls.push("stop");
      },
    };
    const release = proxy.bind(binding);

    await expect(proxy.dispatch(command)).resolves.toEqual({
      commandId: "play-1",
      status: "accepted",
    });
    await expect(proxy.ensureSource()).resolves.toBe("ready");
    await expect(proxy.start(session("bound", 2).state)).resolves.toEqual({
      authorityId: "authority",
      sessionId: "session",
    });
    await expect(
      proxy.seedSession(session("bound", 2).state, { positionMs: 12_000, reason: "resume" }),
    ).resolves.toEqual({ authorityId: "authority", sessionId: "session" });
    proxy.stop();
    expect(calls).toEqual(["dispatch:play", "ensureSource", "start", "seed:resume:12000", "stop"]);

    release();
    expect(proxy.isBound()).toBeFalse();
  });

  test("routes ended only into the controller-owned callback", async () => {
    const calls: string[] = [];
    const onEnded = createPlaybackHostEndedHandler({
      async handleEnded() {
        calls.push("controller-ended");
        return true;
      },
    });

    await expect(onEnded()).resolves.toBeTrue();
    expect(calls).toEqual(["controller-ended"]);
  });
});
