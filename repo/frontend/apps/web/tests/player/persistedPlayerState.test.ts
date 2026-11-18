import { describe, expect, it } from "bun:test";

import { restorePersistedQueueState } from "@/lib/player/persistedPlayerState";
import type { PlayerTrack } from "@/types/player/model";

const legacySong = (id: number) => ({
  id,
  name: `Song ${id}`,
  dt: 200_000,
  fee: 8,
  ar: [{ id: 10, name: "Artist" }],
  al: { id: 20, name: "Album", picUrl: "https://p.example/cover.jpg" },
  publishTime: 0,
});

const qqTrack: PlayerTrack = {
  ref: { provider: "qq", kind: "track", id: "0014Y4JW2xOFyY" },
  title: "QQ Song",
  artists: [{ ref: { provider: "qq", kind: "artist", id: "a" }, name: "Singer" }],
  album: null,
  durationMs: 180_000,
};

describe("restorePersistedQueueState", () => {
  it("converts a queue stored as NetEase songs and keeps its position", () => {
    const restored = restorePersistedQueueState({
      currentSongDetail: legacySong(2),
      historyIndex: 1,
      historyStack: [0, 1],
      lyric: { lrc: { lyric: "[00:00]a" } },
      originalQueue: [legacySong(1), legacySong(2)],
      queue: [legacySong(1), legacySong(2)],
      queueIndex: 1,
    });

    expect(restored.currentTrack?.ref).toEqual({ provider: "netease", kind: "track", id: "2" });
    expect(restored.currentTrack?.netease?.fee).toBe(8);
    expect(restored.currentTrack?.album?.coverUrl).toBe("https://p.example/cover.jpg");
    expect(restored.queue.map((track) => track.ref.id)).toEqual(["1", "2"]);
    expect(restored.queueIndex).toBe(1);
    expect(restored.historyStack).toEqual([0, 1]);
    expect(restored.historyIndex).toBe(1);
    expect(restored.lyric).not.toBeNull();
  });

  it("keeps interface tracks from any platform as they are", () => {
    const restored = restorePersistedQueueState({
      currentTrack: qqTrack,
      historyIndex: 0,
      historyStack: [0],
      queue: [qqTrack],
      originalQueue: [qqTrack],
      queueIndex: 0,
    });

    expect(restored.currentTrack).toEqual(qqTrack);
    expect(restored.queue).toEqual([qqTrack]);
    expect(restored.queueIndex).toBe(0);
  });

  it("drops unreadable entries and finds the current track again", () => {
    const restored = restorePersistedQueueState({
      currentSongDetail: legacySong(3),
      historyIndex: 2,
      historyStack: [0, 1, 2],
      queue: [legacySong(1), { id: "broken" }, legacySong(3)],
      originalQueue: [legacySong(1), null, legacySong(3)],
      queueIndex: 2,
    });

    expect(restored.queue.map((track) => track.ref.id)).toEqual(["1", "3"]);
    expect(restored.originalQueue.map((track) => track.ref.id)).toEqual(["1", "3"]);
    expect(restored.queueIndex).toBe(1);
    expect(restored.historyStack).toEqual([1]);
    expect(restored.historyIndex).toBe(0);
  });

  it("returns an empty player for missing or malformed storage", () => {
    for (const persisted of [undefined, null, "x", { queue: "nope", currentSongDetail: 4 }]) {
      const restored = restorePersistedQueueState(persisted);
      expect(restored.currentTrack).toBeNull();
      expect(restored.queue).toEqual([]);
      expect(restored.queueIndex).toBe(-1);
      expect(restored.historyStack).toEqual([]);
      expect(restored.lyric).toBeNull();
    }
  });
});
