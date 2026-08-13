import { describe, expect, test } from "bun:test";

import { isPlaybackLoadCurrent } from "@/lib/player/playbackLoad";
import type { SongDetail } from "@/types/api/music";

function createSong(id: number): SongDetail {
  return {
    al: { id, name: `Album ${id}`, picUrl: "" },
    ar: [],
    dt: 180_000,
    fee: 0,
    id,
    name: `Song ${id}`,
    publishTime: 0,
  };
}

describe("playback load identity", () => {
  test("accepts only the current track and exact load revision", () => {
    const state = { currentSongDetail: createSong(2), playbackLoadRevision: 7 };

    expect(isPlaybackLoadCurrent(state, { revision: 7, trackId: 2 })).toBeTrue();
    expect(isPlaybackLoadCurrent(state, { revision: 6, trackId: 2 })).toBeFalse();
    expect(isPlaybackLoadCurrent(state, { revision: 7, trackId: 1 })).toBeFalse();
  });

  test("rejects an older same-track replay request", () => {
    const state = { currentSongDetail: createSong(3), playbackLoadRevision: 12 };

    expect(isPlaybackLoadCurrent(state, { revision: 11, trackId: 3 })).toBeFalse();
  });
});
