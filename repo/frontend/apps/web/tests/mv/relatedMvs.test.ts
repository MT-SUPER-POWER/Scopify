import { describe, expect, it } from "bun:test";
import { getRelatedMvKeyword, getRelatedMvs } from "@/lib/music/relatedMvs";
import type { MvSummary } from "@/types/mv/api";

describe("search-backed related MVs", () => {
  it("searches the current title with the main artist", () => {
    expect(
      getRelatedMvKeyword({
        id: 1,
        name: " One More Time ",
        artists: [{ id: 2, name: "Daft Punk" }],
      }),
    ).toBe("One More Time Daft Punk");
    expect(getRelatedMvKeyword({ id: 1, name: "Epilogue", artistName: "Daft Punk" })).toBe(
      "Epilogue Daft Punk",
    );
    expect(getRelatedMvKeyword({ id: 1, name: "Epilogue" })).toBe("Epilogue");
  });

  it("excludes the current MV and duplicates across pages without changing search order", () => {
    const items: MvSummary[] = [
      { id: 1, name: "current" },
      { id: 3, name: "first" },
      { id: 2, name: "second" },
      { id: 3, name: "duplicate on next page" },
    ];
    expect(getRelatedMvs(items, 1)).toEqual([items[1], items[2]]);
    expect(items).toHaveLength(4);
  });

  it("does not truncate recommendations to five items", () => {
    const items = Array.from({ length: 40 }, (_, id) => ({ id: id + 1, name: `MV ${id}` }));
    expect(getRelatedMvs(items, 1)).toHaveLength(39);
  });

  it("keeps empty results empty instead of inserting unrelated recommendations", () => {
    expect(getRelatedMvs([], 1)).toEqual([]);
    expect(getRelatedMvs([{ id: 1, name: "current" }], 1)).toEqual([]);
  });
});
