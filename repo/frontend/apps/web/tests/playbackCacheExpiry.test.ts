import { afterAll, expect, mock, test } from "bun:test";
import type { NeteaseLyric } from "@/types/api/music";

const storage = new Map<string, unknown>();

mock.module("idb-keyval", () => ({
  createStore: () => ({}),
  del: async (key: string) => {
    storage.delete(key);
  },
  entries: async () => [],
  get: async <T>(key: string) => storage.get(key) as T | undefined,
  set: async (key: string, value: unknown) => {
    storage.set(key, structuredClone(value));
  },
}));

const { getCachedPlayUrl, setCachedLyric, setCachedPlayUrl } =
  await import("@/lib/cache/playbackCache");

const originalDateNow = Date.now;

afterAll(() => {
  Date.now = originalDateNow;
  mock.restore();
});

test("updating lyrics does not extend an expired playback URL", async () => {
  let now = 1_000;
  Date.now = () => now;

  await setCachedPlayUrl(1, "high", "https://expired.example/song.mp3");

  now += 31 * 60 * 1000;
  await setCachedLyric(1, {
    lrc: { lyric: "test", version: 1 },
  } as NeteaseLyric);

  expect(await getCachedPlayUrl(1, "high")).toBeNull();
});
