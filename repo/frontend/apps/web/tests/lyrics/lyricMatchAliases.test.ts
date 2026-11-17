import { describe, expect, it } from "bun:test";

import { buildLyricMatchAliasQuery, toLyricMatchCandidates } from "@/lib/lyrics/match";
import type { SongDetail } from "@/types/song/api";

const song: SongDetail = {
  id: 1,
  name: "好久不见",
  dt: 200_000,
  fee: 0,
  ar: [
    { id: 1, name: "陈奕迅" },
    { id: 2, name: "Guest Artist" },
  ],
  al: { id: 1, name: "Album", picUrl: "" },
  publishTime: 0,
  alia: ["Long Time No See"],
};

const resource = (id: number) => ({
  baseInfo: {
    simpleSongData: {
      id,
      name: song.name,
      dt: song.dt,
      ar: song.ar.map((artist) =>
        artist.id === 1 ? { ...artist, alias: ["陈小迅", "Eason Chan"] } : artist,
      ),
    },
  },
});

describe("lyric matching search aliases", () => {
  it("uses a translated artist name from the current track's search result", () => {
    const candidates = toLyricMatchCandidates([resource(song.id)]);
    expect(candidates[0]?.alternateArtistNames).toEqual(["Eason Chan", "Guest Artist"]);
    expect(buildLyricMatchAliasQuery(song, candidates)).toBe("好久不见 Eason Chan Guest Artist");
  });

  it("uses a localized artist name for a Latin name", () => {
    const candidates = toLyricMatchCandidates([
      {
        baseInfo: {
          simpleSongData: {
            id: 3,
            name: "Wonderwall",
            ar: [{ id: 3, name: "Oasis", tns: ["绿洲乐队"] }],
          },
        },
      },
    ]);
    expect(candidates[0]?.alternateArtistNames).toEqual(["绿洲乐队"]);
  });

  it("keeps the primary search when it already gives a likely alternative", () => {
    expect(buildLyricMatchAliasQuery(song, toLyricMatchCandidates([resource(2)]))).toBe("");
  });

  it("tries a song title alias without erasing an instrumental marker", () => {
    expect(buildLyricMatchAliasQuery(song, [])).toBe("Long Time No See 陈奕迅 Guest Artist");
    expect(buildLyricMatchAliasQuery({ ...song, name: "好久不见 (伴奏)" }, [])).toBe("");
  });
});
