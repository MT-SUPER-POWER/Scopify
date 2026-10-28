import { describe, expect, it } from "bun:test";
import { buildLyricExport } from "@/lib/lyrics/export";
import type { NeteaseLyric, SongDetail } from "@/types/song/api";

const song = {
  name: "青花瓷: Live",
  ar: [{ id: 1, name: "周杰伦" }],
} as SongDetail;

const lrc = "[00:01.230]天青色等烟雨\n[00:03.450]而我在等你";
const yrc = "[1230,2220](1230,400,0)天(1630,400,0)青";
const lyric: NeteaseLyric = {
  code: 200,
  lrc: { lyric: lrc, version: 1 },
  yrc: { lyric: yrc, version: 1 },
};

describe("lyric file exports", () => {
  it("preserves timestamps, line breaks and Unicode in a safe file name", () => {
    expect(buildLyricExport(song, lyric, "lrc")).toEqual({
      content: lrc,
      fileName: "青花瓷_ Live - 周杰伦.lrc",
    });
  });

  it("preserves YRC word timings without substituting the LRC branch", () => {
    const file = buildLyricExport(song, lyric, "yrc");
    expect(file?.content).toBe(yrc);
    expect(file?.fileName.endsWith(".yrc")).toBe(true);
    expect(buildLyricExport(song, { code: 200, lrc: lyric.lrc }, "yrc")).toBeNull();
  });

  it("does not create files for missing or blank lyrics", () => {
    expect(buildLyricExport(song, { code: 200 }, "lrc")).toBeNull();
    expect(
      buildLyricExport(
        song,
        {
          code: 200,
          lrc: { lyric: " \n ", version: 1 },
        },
        "lrc",
      ),
    ).toBeNull();
  });
});
