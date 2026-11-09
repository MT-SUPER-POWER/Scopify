import { describe, expect, it } from "bun:test";

import { musicLyricsToSource } from "@/lib/lyrics/musicLyrics";
import { adaptNeteaseLyric } from "@/lib/providers/netease/adapters/lyrics";
import { adaptQqLyric } from "@/lib/providers/qq/adapters/lyrics";

const qqRef = { provider: "qq", kind: "track", id: "0041gObR2QG98x" } as const;
const neteaseRef = { provider: "netease", kind: "track", id: "1" } as const;

describe("adaptQqLyric", () => {
  it("keeps the line-timed lyric and decodes the base64 translation", () => {
    const trans = btoa("[00:01.00]hello");
    const lyrics = adaptQqLyric(qqRef, {
      response: { code: 0, lyric: "[00:01.00]你好", trans },
    });
    expect(lyrics.lines.original).toBe("[00:01.00]你好");
    expect(lyrics.lines.translation).toBe("[00:01.00]hello");
    expect(lyrics.words).toBeNull();
    expect(musicLyricsToSource(lyrics).tlyric?.lyric).toBe("[00:01.00]hello");
  });

  it("treats an empty or unreadable payload as no lyric", () => {
    const lyrics = adaptQqLyric(qqRef, { response: { code: 0, lyric: "", trans: "!!" } });
    expect(lyrics.lines.original).toBeNull();
    expect(lyrics.lines.translation).toBeNull();
  });
});

describe("adaptNeteaseLyric", () => {
  it("round-trips word timing, translation and the pure music flag", () => {
    const lyrics = adaptNeteaseLyric(neteaseRef, {
      code: 200,
      lrc: { version: 1, lyric: "[00:01.00]a" },
      tlyric: { version: 1, lyric: "[00:01.00]b" },
      yrc: { version: 1, lyric: "[1000,500](1000,500,0)a" },
      pureMusic: true,
    });
    const source = musicLyricsToSource(lyrics);
    expect(source.lrc?.lyric).toBe("[00:01.00]a");
    expect(source.tlyric?.lyric).toBe("[00:01.00]b");
    expect(source.yrc?.lyric).toBe("[1000,500](1000,500,0)a");
    expect(source.ytlrc).toBeUndefined();
    expect(source.pureMusic).toBe(true);
  });
});
