import { expect, test } from "bun:test";

import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import {
  buildLyricMatchQuery,
  getLyricMatchScore,
  hasUsableNeteaseLyric,
  mapSongSearchResourceToLyricMatchCandidate,
} from "@/lib/lyrics/match";
import { type NeteaseLyric, pruneNeteaseLyric, type SongDetail } from "@/types/api/music";

test("adapts YRC words and aligns YRC translation and romanization", () => {
  const lyric: NeteaseLyric = {
    code: 200,
    lrc: { lyric: "[00:01.000]fallback", version: 1 },
    yrc: {
      lyric:
        '{"t":0,"c":[{"tx":"Composer: "},{"tx":"Scopify","li":"https://image.test/a.png"}]}\n[1000,1000](1000,300,0)Hel(1300,700,0)lo',
      version: 1,
    },
    yromalrc: { lyric: "[00:01.000]ni hao", version: 1 },
    ytlrc: { lyric: "[00:01.000]你好", version: 1 },
  };

  const result = adaptNeteaseLyric(lyric);

  expect(result.source).toBe("yrc");
  expect(result.isWordByWord).toBe(true);
  expect(result.lines).toEqual([
    {
      endTimeMs: 2000,
      romanization: "ni hao",
      startTimeMs: 1000,
      text: "Hello",
      translation: "你好",
      words: [
        { endTimeMs: 1300, startTimeMs: 1000, text: "Hel" },
        { endTimeMs: 2000, startTimeMs: 1300, text: "lo" },
      ],
    },
  ]);
  expect(result.metadata.timedCredits).toEqual([
    {
      entries: [{ text: "Composer: " }, { imageUrl: "https://image.test/a.png", text: "Scopify" }],
      startTimeMs: 0,
    },
  ]);
});

test("falls back to LRC and keeps the complete raw response", () => {
  const lyric: NeteaseLyric = {
    code: 200,
    futureField: { preserved: true },
    lrc: { lyric: "[ar:Artist]\n[00:01.50]first\n[00:03.000]second", version: 1 },
    romalrc: { lyric: "[00:01.50]yi\n[00:03.000]er", version: 1 },
    tlyric: { lyric: "[00:01.50]one\n[00:03.000]two", version: 1 },
  };

  const result = adaptNeteaseLyric(lyric);

  expect(result.source).toBe("lrc");
  expect(result.isWordByWord).toBe(false);
  expect(result.metadata.artist).toBe("Artist");
  expect(result.lines).toEqual([
    {
      endTimeMs: 3000,
      romanization: "yi",
      startTimeMs: 1500,
      text: "first",
      translation: "one",
      words: [{ endTimeMs: 3000, startTimeMs: 1500, text: "first" }],
    },
    {
      endTimeMs: 3000,
      romanization: "er",
      startTimeMs: 3000,
      text: "second",
      translation: "two",
      words: [{ endTimeMs: 3000, startTimeMs: 3000, text: "second" }],
    },
  ]);
  expect(result.raw).toBe(lyric);
  expect(result.raw.futureField).toEqual({ preserved: true });
  expect(pruneNeteaseLyric(lyric)).toBe(lyric);
});

test("maps and ranks NetEase lyric-match candidates from song search results", () => {
  const song: SongDetail = {
    al: { id: 3, name: "Album", picUrl: "" },
    ar: [{ id: 2, name: "Artist" }],
    dt: 180_000,
    fee: 0,
    id: 1,
    name: "A Song",
    publishTime: 0,
  };
  const candidate = mapSongSearchResourceToLyricMatchCandidate({
    baseInfo: {
      simpleSongData: {
        al: { id: 3, name: "Album", picUrl: "https://image.test/cover.png" },
        ar: [{ id: 2, name: "Artist" }],
        dt: 181_500,
        id: 9,
        name: "A Song",
      },
    },
  });

  expect(buildLyricMatchQuery(song)).toBe("A Song Artist");
  expect(candidate).toEqual({
    albumName: "Album",
    artistNames: ["Artist"],
    coverUrl: "https://image.test/cover.png",
    durationMs: 181_500,
    id: 9,
    name: "A Song",
  });
  expect(candidate && getLyricMatchScore(song, candidate)).toBe(100);
});

test("accepts only lyrics with a usable primary timing source", () => {
  expect(hasUsableNeteaseLyric({ code: 200, lrc: { lyric: "[00:01.00]line", version: 1 } })).toBe(
    true,
  );
  expect(hasUsableNeteaseLyric({ code: 200, yrc: { lyric: "  ", version: 1 } })).toBe(false);
});
