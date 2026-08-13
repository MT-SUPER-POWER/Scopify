import { describe, expect, test } from "bun:test";

import {
  fitTracklistColumnWidths,
  getDefaultTracklistColumnWidths,
  getTracklistResizePairs,
  getTracklistVisibleColumns,
  resetTracklistColumnPair,
  resizeTracklistColumnPair,
} from "@/lib/playlist/tracklistColumnLayout";

describe("tracklist column layout", () => {
  test("uses the agreed full-layout percentages after the fixed index column", () => {
    const columns = getTracklistVisibleColumns({
      showAlbumColumn: true,
      showDateColumn: true,
      showLikeColumn: true,
    });

    expect(getDefaultTracklistColumnWidths(1056, columns)).toEqual({
      album: 300,
      date: 150,
      duration: 80,
      index: 56,
      like: 70,
      title: 400,
    });
  });

  test("uses the medium and compact breakpoint percentages", () => {
    const mediumColumns = getTracklistVisibleColumns({
      showAlbumColumn: true,
      showDateColumn: false,
      showLikeColumn: false,
    });
    const compactColumns = getTracklistVisibleColumns({
      showAlbumColumn: false,
      showDateColumn: false,
      showLikeColumn: false,
    });

    expect(getDefaultTracklistColumnWidths(1056, mediumColumns)).toMatchObject({
      album: 300,
      duration: 100,
      index: 56,
      title: 600,
    });
    expect(getDefaultTracklistColumnWidths(1056, compactColumns)).toMatchObject({
      duration: 140,
      index: 56,
      title: 860,
    });
  });

  test("exposes only boundaries that exchange space between non-index columns", () => {
    const fullColumns = getTracklistVisibleColumns({
      showAlbumColumn: true,
      showDateColumn: true,
      showLikeColumn: true,
    });
    const compactColumns = getTracklistVisibleColumns({
      showAlbumColumn: false,
      showDateColumn: false,
      showLikeColumn: false,
    });

    expect(getTracklistResizePairs(fullColumns)).toEqual([
      { left: "title", right: "album" },
      { left: "album", right: "date" },
      { left: "date", right: "like" },
      { left: "like", right: "duration" },
    ]);
    expect(getTracklistResizePairs(compactColumns)).toEqual([{ left: "title", right: "duration" }]);
  });

  test("moves only the two columns beside a divider and clamps at their minimum widths", () => {
    const columns = getTracklistVisibleColumns({
      showAlbumColumn: true,
      showDateColumn: true,
      showLikeColumn: true,
    });
    const widths = getDefaultTracklistColumnWidths(1056, columns);
    const pair = { left: "title", right: "album" } as const;

    expect(resizeTracklistColumnPair(widths, pair, 120)).toMatchObject({
      album: 180,
      date: 150,
      duration: 80,
      index: 56,
      like: 70,
      title: 520,
    });
    expect(resizeTracklistColumnPair(widths, pair, 1000)).toMatchObject({
      album: 120,
      title: 580,
    });
  });

  test("double-click reset restores only a pair's default ratio", () => {
    const columns = getTracklistVisibleColumns({
      showAlbumColumn: true,
      showDateColumn: true,
      showLikeColumn: true,
    });
    const widths = getDefaultTracklistColumnWidths(1056, columns);
    const pair = { left: "title", right: "album" } as const;
    const resized = resizeTracklistColumnPair(widths, pair, 120);

    expect(resetTracklistColumnPair(resized, pair, columns)).toMatchObject({
      album: 300,
      date: 150,
      duration: 80,
      index: 56,
      like: 70,
      title: 400,
    });
  });

  test("preserves a temporary proportion when the container changes without a breakpoint change", () => {
    const columns = getTracklistVisibleColumns({
      showAlbumColumn: true,
      showDateColumn: true,
      showLikeColumn: true,
    });
    const widths = getDefaultTracklistColumnWidths(1056, columns);
    const resized = resizeTracklistColumnPair(widths, { left: "title", right: "album" }, 120);
    const fitted = fitTracklistColumnWidths(resized, 1256, columns);

    expect(fitted.index).toBe(56);
    expect(fitted.title / fitted.album).toBeCloseTo(520 / 180);
    expect(Object.values(fitted).reduce((sum, width) => sum + width, 0)).toBe(1256);
  });
});
