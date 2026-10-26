import { describe, expect, it } from "bun:test";
import {
  normalizeSheetPreview,
  normalizeSongSheets,
  normalizeSongWiki,
} from "@/lib/music/songResources";
import { mapSheetSearchSong } from "@/lib/search/sheetSongAdapter";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { getSearchCategory, buildSearchUrl } from "@/lib/search/searchCategory";
import wiki from "./fixtures/rubia-wiki.json";
import sheets from "./fixtures/rubia-sheets.json";

describe("song encyclopedia and sheets", () => {
  it("extracts credits, creation background, genre and BPM from a real wiki response", () => {
    const sections = normalizeSongWiki(wiki);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.description).toContain("Rubia");
    expect(sections[0]?.fields).toContainEqual({ label: "作词", value: "TetraCalyx" });
    expect(sections[1]?.fields).toContainEqual({ label: "BPM", value: "68" });
    expect(sections[1]?.fields.find((field) => field.label === "曲风")?.value).toContain("流行");
  });

  it("keeps valid missing wiki data distinct from a malformed response", () => {
    expect(normalizeSongWiki({ code: 200, data: { blocks: [] } })).toEqual([]);
    expect(() => normalizeSongWiki({ code: 200 } as never)).toThrow();
    expect(() =>
      normalizeSongWiki({ code: 200, data: { blocks: [{ bizCode: "songDetailNewSongWiki" }] } }),
    ).toThrow();
  });

  it("maps all real sheet arrangements without losing IDs, difficulty or page counts", () => {
    const items = normalizeSongSheets(sheets);
    expect(items).toHaveLength(5);
    expect(items.find((sheet) => sheet.id === 143190)?.totalPageSize).toBe(6);
    expect(items.find((sheet) => sheet.id === 245207)?.difficulty).toBe("简单");
    expect(items.find((sheet) => sheet.id === 245207)?.chordName).toBe("分解和弦");
  });

  it("rejects malformed sheet lists and deduplicates repeated arrangements", () => {
    expect(normalizeSongSheets({ code: 200, data: { musicSheetSimpleInfoVOS: [] } })).toEqual([]);
    expect(() => normalizeSongSheets({ code: 200, data: {} } as never)).toThrow();
    expect(
      normalizeSongSheets({
        code: 200,
        data: { musicSheetSimpleInfoVOS: null, errorCode: 404 },
      } as never),
    ).toEqual([]);
    expect(() =>
      normalizeSongSheets({
        code: 200,
        data: { musicSheetSimpleInfoVOS: null, errorCode: 500 },
      } as never),
    ).toThrow();
    expect(() =>
      normalizeSongSheets({
        code: 200,
        data: { musicSheetSimpleInfoVOS: [{ id: 0, name: "bad" }] },
      }),
    ).toThrow();
    const item = sheets.data.musicSheetSimpleInfoVOS[0];
    if (!item) throw new Error("Fixture must contain a sheet");
    expect(
      normalizeSongSheets({ code: 200, data: { musicSheetSimpleInfoVOS: [item, item] } }),
    ).toHaveLength(1);
  });

  it("preserves preview page order and rejects unsafe or malformed page addresses", () => {
    expect(
      normalizeSheetPreview({
        code: 200,
        data: ["https://example.com/1.jpg", { imageUrl: "https://example.com/2.jpg" }],
      }),
    ).toEqual(["https://example.com/1.jpg", "https://example.com/2.jpg"]);
    expect(normalizeSheetPreview({ code: 200, data: [] })).toEqual([]);
    expect(() =>
      normalizeSheetPreview({ code: 200, data: [{ imageUrl: "javascript:alert(1)" }] }),
    ).toThrow();
    expect(() => normalizeSheetPreview({ code: 200, data: {} })).toThrow();
  });

  it("keeps song IDs for the follow-up sheet-list request", () => {
    const song = mapSheetSearchSong(
      {
        baseInfo: {
          simpleSongData: { id: 1815684465, name: "Rubia", ar: [{ id: 1, name: "周深" }] },
        },
      },
      "Unknown",
      "Unknown album",
    );
    expect(song.id).toBe(1815684465);
    expect(song.ar[0]?.name).toBe("周深");
    expect(() => mapSheetSearchSong({}, "Unknown", "Unknown album")).toThrow();
  });

  it("supports the sheet category in search URLs", () => {
    expect(getSearchCategory("Sheets")).toBe("Sheets");
    expect(buildSearchUrl("Rubia", "Sheets")).toBe("/search?keywords=Rubia&tab=Sheets");
  });

  it("throws first-load errors but retains cached content on refresh failure", () => {
    expect(throwQueryErrorWithoutData(new Error("offline"), { state: { data: undefined } })).toBe(
      true,
    );
    expect(throwQueryErrorWithoutData(new Error("offline"), { state: { data: [] } })).toBe(false);
    expect(throwQueryErrorWithoutData(new Error("offline"), { state: { data: sheets } })).toBe(
      false,
    );
  });
});
