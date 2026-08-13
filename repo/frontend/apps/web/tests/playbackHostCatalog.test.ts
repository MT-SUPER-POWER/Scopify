import { describe, expect, mock, test } from "bun:test";

import type { PlaybackQueueEntry } from "@mt-super-power/desktop-contract";

import {
  createNeteasePlaybackCatalog,
  createPlaybackCatalogPort,
} from "@/lib/playbackHost/neteaseCatalog";
import type { PlaybackSourceRequest } from "@/lib/playbackHost/catalog";
import type { NeteaseLyric } from "@/types/api/music";

const lyric: NeteaseLyric = { code: 200, lrc: { lyric: "[00:00.00]Hello", version: 1 } };

function createEntry(overrides: Partial<PlaybackQueueEntry> = {}): PlaybackQueueEntry {
  return {
    album: { artworkUrl: "https://example.test/cover.jpg", id: 9, title: "Album" },
    artists: [{ id: 2, name: "Artist" }],
    durationMs: 180_000,
    fee: 0,
    id: 1,
    publishTime: 0,
    title: "Track",
    ...overrides,
  };
}

function createRequest(key: string): PlaybackSourceRequest<NeteaseLyric> {
  return {
    loadEpoch: 1,
    sourceLoadRevision: 1,
    session: {
      key,
      sourceLoadRevision: 1,
      state: {
        canControl: true,
        durationMs: 180_000,
        liked: false,
        lyrics: null,
        lyricsVersion: null,
        phase: "paused",
        track: null,
        volume: 80,
      },
    },
  };
}

function createCache(overrides: Record<string, unknown> = {}) {
  return {
    getCachedLyric: mock(async () => null),
    getCachedPlayUrl: mock(async () => null),
    setCachedLyric: mock(async () => undefined),
    setCachedPlayUrl: mock(async () => undefined),
    ...overrides,
  };
}

describe("Netease Playback Host catalog", () => {
  test("returns a complete cached source without calling network APIs", async () => {
    const cache = createCache({
      getCachedLyric: mock(async () => lyric),
      getCachedPlayUrl: mock(async () => "https://cdn.example.test/cached.mp3"),
    });
    const getLyric = mock(async () => ({ data: lyric }));
    const getSongUrlWithQuality = mock(async () => ({
      data: "https://cdn.example.test/fresh.mp3",
    }));
    const catalog = createNeteasePlaybackCatalog({
      dependencies: {
        cache,
        getLyric,
        getSongUrlWithQuality,
        getStoredLyric: async () => null,
      },
    });

    await expect(
      catalog.resolve(createEntry(), "high", new AbortController().signal),
    ).resolves.toEqual({
      durationMs: 180_000,
      lyrics: lyric,
      sourceUrl: "https://cdn.example.test/cached.mp3",
    });
    expect(getLyric).not.toHaveBeenCalled();
    expect(getSongUrlWithQuality).not.toHaveBeenCalled();
    expect(cache.setCachedPlayUrl).not.toHaveBeenCalled();
    expect(cache.setCachedLyric).not.toHaveBeenCalled();
  });

  test("writes URL then lyric through one serial cache record boundary", async () => {
    const writes: string[] = [];
    const cache = createCache({
      setCachedLyric: mock(async () => {
        writes.push("lyric");
      }),
      setCachedPlayUrl: mock(async () => {
        writes.push("url");
      }),
    });
    const catalog = createNeteasePlaybackCatalog({
      dependencies: {
        cache,
        getLyric: async () => ({ data: lyric }),
        getSongUrlWithQuality: async () => ({ data: "https://cdn.example.test/fresh.mp3" }),
        getStoredLyric: async () => null,
      },
    });

    await expect(
      catalog.resolve(createEntry(), "lossless", new AbortController().signal),
    ).resolves.toEqual({
      durationMs: 180_000,
      lyrics: lyric,
      sourceUrl: "https://cdn.example.test/fresh.mp3",
    });
    expect(writes).toEqual(["url", "lyric"]);
  });

  test("uses the voice transcript in preference to cached or ordinary NetEase lyrics", async () => {
    const voiceLyric: NeteaseLyric = { code: 200, yrc: { lyric: "[0,1](0,1,0)Hi", version: 1 } };
    const cache = createCache({
      getCachedPlayUrl: mock(async () => "https://cdn.example.test/voice.mp3"),
      getCachedLyric: mock(async () => {
        throw new Error("voice entries must not use the ordinary lyric cache");
      }),
    });
    const getLyric = mock(async () => ({ data: lyric }));
    const getVoiceNeteaseLyric = mock(async () => voiceLyric);
    const catalog = createNeteasePlaybackCatalog({
      dependencies: {
        cache,
        getLyric,
        getStoredLyric: async () => null,
        getVoiceNeteaseLyric,
      },
    });

    await expect(
      catalog.resolve(createEntry({ voiceId: 99 }), "standard", new AbortController().signal),
    ).resolves.toMatchObject({
      lyrics: voiceLyric,
      sourceUrl: "https://cdn.example.test/voice.mp3",
    });
    expect(getLyric).not.toHaveBeenCalled();
    expect(getVoiceNeteaseLyric).toHaveBeenCalledWith(99);
    expect(cache.setCachedLyric).not.toHaveBeenCalled();
  });

  test("honours an AbortSignal before a pending resolution reaches cache writes", async () => {
    let resolveUrl: ((value: { data: string }) => void) | undefined;
    const cache = createCache();
    const catalog = createNeteasePlaybackCatalog({
      dependencies: {
        cache,
        getLyric: async () => ({ data: lyric }),
        getSongUrlWithQuality: () =>
          new Promise((resolve) => {
            resolveUrl = resolve;
          }),
        getStoredLyric: async () => null,
      },
    });
    const controller = new AbortController();
    const result = catalog.resolve(createEntry(), "high", controller.signal);

    controller.abort();
    resolveUrl?.({ data: "https://cdn.example.test/late.mp3" });

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(cache.setCachedPlayUrl).not.toHaveBeenCalled();
    expect(cache.setCachedLyric).not.toHaveBeenCalled();
  });

  test("rejects a stale resolver even if it ignores AbortSignal before source application", async () => {
    const pending: Array<
      (value: { durationMs: number; lyrics: NeteaseLyric | null; sourceUrl: string }) => void
    > = [];
    const applied: string[] = [];
    const port = createPlaybackCatalogPort({
      applyResolvedSource: ({ request }) => {
        applied.push(request.session.key);
        return true;
      },
      resolve: () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    });

    const first = port.ensureSource(createRequest("first"));
    const second = port.ensureSource(createRequest("second"));
    pending[0]?.({ durationMs: 1, lyrics: null, sourceUrl: "https://example.test/first.mp3" });
    pending[1]?.({ durationMs: 2, lyrics: lyric, sourceUrl: "https://example.test/second.mp3" });

    await expect(first).resolves.toBeFalse();
    await expect(second).resolves.toBeTrue();
    expect(applied).toEqual(["second"]);
  });
});
