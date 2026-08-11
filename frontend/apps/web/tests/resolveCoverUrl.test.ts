import { expect, test } from "bun:test";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import type { Song } from "@/types/search";

test("falls back when a recommended voice song has an empty album cover", () => {
  const voiceCoverUrl = "https://image.test/voice-cover.jpg";

  expect(resolveCoverUrl("", undefined, voiceCoverUrl)).toBe(voiceCoverUrl);
});

test("uses a song coverUrl when picUrl is unavailable", () => {
  const coverUrl = "https://image.test/program-cover.jpg";

  expect(resolveCoverUrl("", coverUrl)).toBe(coverUrl);
});

test("prefers the voice cover over a non-empty album placeholder", () => {
  const song: Song = {
    album: {
      artist: { id: 0, name: "", picUrl: null },
      id: 0,
      name: "Unknown album",
      // NetEase returns this non-empty URL as its generic 300x300 music-note
      // placeholder for many voice programs.
      picUrl: "http://p3.music.126.net/0ju8ET1ApZSXfWacc4w49w==/109951169484091680.jpg",
      publishTime: 0,
      size: 0,
    },
    artists: [],
    duration: 1_000,
    id: 42,
    name: "Voice program",
  };

  expect(toVoiceSongDetail(song, "https://image.test/voice-cover.jpg").al.picUrl).toBe(
    "https://image.test/voice-cover.jpg",
  );
});
