import { describe, expect, test } from "bun:test";

import {
  fitRadioTracklistColumnWidths,
  getDefaultRadioTracklistColumnWidths,
  getRadioTracklistResizePairs,
  getRadioTracklistVisibleColumns,
  resetRadioTracklistColumnPair,
  resizeRadioTracklistColumnPair,
} from "@/lib/radio/radioTracklistColumnLayout";

describe("radio tracklist column layout", () => {
  test("uses the radio-specific full layout after the fixed index column", () => {
    const columns = getRadioTracklistVisibleColumns({
      showPlayCountColumn: true,
      showUpdatedAtColumn: true,
    });

    expect(getDefaultRadioTracklistColumnWidths(1056, columns)).toEqual({
      duration: 120,
      index: 56,
      playCount: 140,
      progress: 120,
      title: 460,
      updatedAt: 160,
    });
  });

  test("keeps only the core radio columns when metadata is hidden responsively", () => {
    const compactColumns = getRadioTracklistVisibleColumns({
      showPlayCountColumn: false,
      showUpdatedAtColumn: false,
    });

    expect(getDefaultRadioTracklistColumnWidths(1056, compactColumns)).toMatchObject({
      duration: 140,
      index: 56,
      progress: 160,
      title: 700,
    });
  });

  test("only exposes dividers between adjacent non-index columns", () => {
    const fullColumns = getRadioTracklistVisibleColumns({
      showPlayCountColumn: true,
      showUpdatedAtColumn: true,
    });
    const compactColumns = getRadioTracklistVisibleColumns({
      showPlayCountColumn: false,
      showUpdatedAtColumn: false,
    });

    expect(getRadioTracklistResizePairs(fullColumns)).toEqual([
      { left: "title", right: "progress" },
      { left: "progress", right: "updatedAt" },
      { left: "updatedAt", right: "playCount" },
      { left: "playCount", right: "duration" },
    ]);
    expect(getRadioTracklistResizePairs(compactColumns)).toEqual([
      { left: "title", right: "progress" },
      { left: "progress", right: "duration" },
    ]);
  });

  test("moves only the two columns alongside a divider and respects their minimum widths", () => {
    const columns = getRadioTracklistVisibleColumns({
      showPlayCountColumn: true,
      showUpdatedAtColumn: true,
    });
    const widths = getDefaultRadioTracklistColumnWidths(1056, columns);
    const pair = { left: "title", right: "progress" } as const;

    expect(resizeRadioTracklistColumnPair(widths, pair, 80)).toEqual({
      duration: 120,
      index: 56,
      playCount: 140,
      progress: 80,
      title: 500,
      updatedAt: 160,
    });
    expect(resizeRadioTracklistColumnPair(widths, pair, -1_000)).toMatchObject({
      progress: 360,
      title: 220,
    });
  });

  test("resets only a divider pair and preserves a temporary layout proportion on resize", () => {
    const columns = getRadioTracklistVisibleColumns({
      showPlayCountColumn: true,
      showUpdatedAtColumn: true,
    });
    const widths = getDefaultRadioTracklistColumnWidths(1056, columns);
    const pair = { left: "title", right: "progress" } as const;
    const resized = resizeRadioTracklistColumnPair(widths, pair, 80);

    expect(resetRadioTracklistColumnPair(resized, pair, columns)).toMatchObject({
      progress: 120,
      title: 460,
    });

    const fitted = fitRadioTracklistColumnWidths(resized, 1256, columns);
    expect(fitted.index).toBe(56);
    expect(fitted.title / fitted.progress).toBeCloseTo(500 / 80);
    expect(Object.values(fitted).reduce((sum, width) => sum + width, 0)).toBe(1256);
  });

  test("re-establishes the default hierarchy after expanding from a minimum-width layout", () => {
    const columns = getRadioTracklistVisibleColumns({
      showPlayCountColumn: true,
      showUpdatedAtColumn: true,
    });
    const minimumWidths = getDefaultRadioTracklistColumnWidths(0, columns);

    expect(fitRadioTracklistColumnWidths(minimumWidths, 1056, columns)).toEqual(
      getDefaultRadioTracklistColumnWidths(1056, columns),
    );
  });
});
