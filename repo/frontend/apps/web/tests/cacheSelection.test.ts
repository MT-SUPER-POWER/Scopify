import { describe, expect, test } from "bun:test";
import { getCacheSelectionKey } from "@/constants/cache";
import { getCacheScopeSelectionState, getCacheSelectionSummary } from "@/lib/cache/cacheSelection";
import type { CacheStats } from "@/types/cache";

const stats: CacheStats = {
  rootDir: "cache",
  page: {
    scope: "page",
    dir: "cache/page",
    enabled: true,
    maxSizeMB: 256,
    entryCount: 4,
    sizeBytes: 112,
    categories: [
      { category: "album", entryCount: 2, sizeBytes: 64 },
      { category: "search", entryCount: 1, sizeBytes: 32 },
      { category: "other", entryCount: 1, sizeBytes: 16 },
    ],
  },
  playback: {
    scope: "playback",
    dir: "cache/playback",
    enabled: true,
    maxSizeMB: 64,
    entryCount: 3,
    sizeBytes: 72,
    categories: [
      { category: "play-url", entryCount: 1, sizeBytes: 8 },
      { category: "online-lyric", entryCount: 1, sizeBytes: 40 },
      { category: "other", entryCount: 1, sizeBytes: 24 },
    ],
  },
};

describe("cache cleanup selection", () => {
  test("sums only selected cache categories", () => {
    expect(
      getCacheSelectionSummary(
        stats,
        new Set([
          getCacheSelectionKey("page", "album"),
          getCacheSelectionKey("playback", "online-lyric"),
        ]),
      ),
    ).toEqual({ entryCount: 3, sizeBytes: 104 });
  });

  test("reports a mixed scope selection for the square checkbox", () => {
    expect(
      getCacheScopeSelectionState(
        "playback",
        new Set([getCacheSelectionKey("playback", "play-url")]),
      ),
    ).toEqual({ checked: false, indeterminate: true });
  });

  test("keeps the two other categories independent", () => {
    const pageOther = getCacheSelectionKey("page", "other");
    const playbackOther = getCacheSelectionKey("playback", "other");

    expect(getCacheSelectionSummary(stats, new Set([pageOther]))).toEqual({
      entryCount: 1,
      sizeBytes: 16,
    });
    expect(getCacheSelectionSummary(stats, new Set([playbackOther]))).toEqual({
      entryCount: 1,
      sizeBytes: 24,
    });
    expect(getCacheSelectionSummary(stats, new Set([pageOther, playbackOther]))).toEqual({
      entryCount: 2,
      sizeBytes: 40,
    });
  });
});
