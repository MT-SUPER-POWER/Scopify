import { expect, test } from "bun:test";

import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
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
      words: [{ endTimeMs: 2850, startTimeMs: 1500, text: "first" }],
    },
    {
      endTimeMs: 8000,
      romanization: "er",
      startTimeMs: 3000,
      text: "second",
      translation: "two",
      words: [{ endTimeMs: 7500, startTimeMs: 3000, text: "second" }],
    },
  ]);
  expect(result.raw).toBe(lyric);
  expect(result.raw.futureField).toEqual({ preserved: true });
  expect(pruneNeteaseLyric(lyric)).toBe(lyric);
});

test("decodes AWLRC containers with word timing, translation, and romanization", () => {
  const encode = (value: string) => Buffer.from(value, "utf8").toString("base64");
  const awlrc = [
    "[ti:AWLRC Song]",
    "[ar:Artist]",
    "[00:01.97]<0,400>原<400,600>文",
    "[00:03.000]<0,500>下<500,500>句",
  ].join("\n");
  const translation = "[00:01.97]Translation\n[00:03.000]Next";
  const romanization = "[00:01.97]yuan wen\n[00:03.000]xia ju";
  const container = `[awlrc:awlrc:${encode(awlrc)},tlrc:${encode(translation)},rlrc:${encode(romanization)}]`;

  const result = adaptNeteaseLyric({
    code: 200,
    lrc: { lyric: `[00:01.000]fallback\n${container}`, version: 1 },
  });

  expect(result.source).toBe("awlrc");
  expect(result.isWordByWord).toBe(true);
  expect(result.metadata).toMatchObject({ artist: "Artist", title: "AWLRC Song" });
  expect(result.lines[0]).toEqual({
    endTimeMs: 2097,
    romanization: "yuan wen",
    startTimeMs: 1097,
    text: "原文",
    translation: "Translation",
    words: [
      { endTimeMs: 1497, startTimeMs: 1097, text: "原" },
      { endTimeMs: 2097, startTimeMs: 1497, text: "文" },
    ],
  });
});

test("accepts a raw .awlrc word-timed track", () => {
  const result = adaptNeteaseLyric({
    code: 200,
    lrc: { lyric: "[00:01.000]<0,250,0>A<250,250,0>B", version: 1 },
  });

  expect(result.source).toBe("awlrc");
  expect(result.lines[0]).toMatchObject({ endTimeMs: 1500, startTimeMs: 1000, text: "AB" });
});

test("synthesizes staggered CJK word timing for line-timed LRC visualizers", () => {
  const result = adaptLyricDataToFolia(
    adaptNeteaseLyric({
      code: 200,
      lrc: {
        lyric: "[00:01.000]逐字出现\n[00:05.000]下一行",
        version: 1,
      },
    }),
  );
  const line = result.lines.find((candidate) => candidate.fullText === "逐字出现");

  expect(line?.words.map((word) => word.text)).toEqual(["逐", "字", "出", "现"]);
  expect(line?.words.map((word) => word.startTime)).toEqual([1, 1.9, 2.8, 3.7]);

  const visibleTextAtIntermediateTime = line?.words
    .filter((word) => word.startTime <= 1.95)
    .map((word) => word.text)
    .join("");
  expect(visibleTextAtIntermediateTime).toBe("逐字");
});

test("surfaces timed credits and animates long instrumental gaps in Folia", () => {
  const lyrics = adaptNeteaseLyric({
    code: 200,
    yrc: {
      lyric: [
        '{"t":0,"c":[{"tx":"Composer: "},{"tx":"Scopify"}]}',
        "[8000,1000](8000,1000,0)First",
        "[14000,1000](14000,1000,0)Second",
      ].join("\n"),
      version: 1,
    },
  });

  const result = adaptLyricDataToFolia(lyrics);

  expect(result.lines.map((line) => line.fullText)).toEqual([
    "Composer: Scopify",
    "......",
    "First",
    "......",
    "Second",
  ]);
  expect(result.lines[0]).toMatchObject({
    endTime: 3,
    fullText: "Composer: Scopify",
    startTime: 0,
  });
  expect(result.lines[1]).toMatchObject({
    endTime: 7.95,
    fullText: "......",
    startTime: 3.05,
  });
  expect(result.lines[1]?.words).toHaveLength(6);
  expect(result.lines[3]).toMatchObject({
    endTime: 13.95,
    fullText: "......",
    startTime: 9.05,
  });
  expect(result.lines[3]?.words).toHaveLength(6);
});

test("marks chorus ranges so Folia visualizers can activate song effects", () => {
  const lyrics = adaptNeteaseLyric({
    code: 200,
    lrc: {
      lyric: "[00:01.000]Verse\n[00:10.000]Chorus\n[00:14.000]Outro",
      version: 1,
    },
  });

  const result = adaptLyricDataToFolia(lyrics, [{ startTimeMs: 9_000, endTimeMs: 13_000 }]);
  const chorusLine = result.lines.find((line) => line.fullText === "Chorus");

  expect(result.lines[0]?.isChorus).toBeUndefined();
  expect(chorusLine).toMatchObject({
    chorusEffect: "bars",
    fullText: "Chorus",
    isChorus: true,
  });
  expect(result.lines.find((line) => line.fullText === "Outro")?.isChorus).toBeUndefined();
});

test("detects repeated chorus text when NetEase has no native chorus ranges", () => {
  const lyrics = adaptNeteaseLyric({
    code: 200,
    lrc: {
      lyric: [
        "[00:01.000]Verse",
        "[00:05.000]We sing together",
        "[00:10.000]Bridge",
        "[00:15.000]We sing together",
        "[00:20.000]Outro",
      ].join("\n"),
      version: 1,
    },
  });

  const result = adaptLyricDataToFolia(lyrics);
  const repeatedLines = result.lines.filter((line) => line.fullText === "We sing together");

  expect(repeatedLines).toHaveLength(2);
  expect(repeatedLines.every((line) => line.isChorus)).toBe(true);
  expect(repeatedLines.every((line) => line.chorusEffect === "bars")).toBe(true);
  expect(result.lines.find((line) => line.fullText === "Verse")?.isChorus).toBeUndefined();
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
