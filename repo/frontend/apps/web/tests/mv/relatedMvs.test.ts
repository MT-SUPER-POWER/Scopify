import { describe, expect, it } from "bun:test";
import type { MusicMv } from "@scopify/music-domain/mv";
import { getRelatedMvKeyword } from "@/lib/providers/netease/adapters/mv";
import { getRelatedMvs } from "@/lib/music/relatedMvs";

function mv(id: string, title: string): MusicMv {
  return {
    ref: { provider: "netease", kind: "mv", id },
    title,
    coverUrl: null,
    artists: [],
    durationMs: null,
    playCount: null,
  };
}

describe("search-backed related MVs", () => {
  it("searches the current title with the main artist", () => {
    const artist = {
      ref: { provider: "netease", kind: "artist", id: "2" },
      name: "Daft Punk",
    } as const;
    expect(getRelatedMvKeyword({ title: " One More Time ", artists: [artist] })).toBe(
      "One More Time Daft Punk",
    );
    expect(getRelatedMvKeyword({ title: "Epilogue", artists: [] })).toBe("Epilogue");
  });

  it("excludes the current MV and duplicates across pages without changing the order", () => {
    const items = [mv("1", "current"), mv("3", "first"), mv("2", "second"), mv("3", "again")];
    expect(getRelatedMvs(items, "1")).toEqual([items[1], items[2]]);
    expect(items).toHaveLength(4);
  });

  it("does not truncate recommendations to five items", () => {
    const items = Array.from({ length: 40 }, (_, id) => mv(String(id + 1), `MV ${id}`));
    expect(getRelatedMvs(items, "1")).toHaveLength(39);
  });

  it("keeps empty results empty instead of inserting unrelated recommendations", () => {
    expect(getRelatedMvs([], "1")).toEqual([]);
    expect(getRelatedMvs([mv("1", "current")], "1")).toEqual([]);
  });
});
