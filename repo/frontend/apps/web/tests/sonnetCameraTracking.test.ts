import { describe, expect, test } from "bun:test";

import {
  resolveSonnetCameraTrackingGlyphs,
  resolveSonnetSegmentCameraFocus,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetCameraTracking";

const textGlyphs = [
  { baseX: -180, baseY: 0, startTime: 10 },
  { baseX: 0, baseY: 0, startTime: 10.5 },
  { baseX: 180, baseY: 0, startTime: 11 },
];

describe("Sonnet camera tracking glyphs", () => {
  test("excludes background geometry without changing semantic focus", () => {
    const withBackground = resolveSonnetCameraTrackingGlyphs([
      { baseX: 0, baseY: 0, startTime: 10, isBackgroundShape: true, isTextGlyph: false },
      ...textGlyphs,
    ]);

    expect(withBackground).toEqual(textGlyphs);
    [9.99, 10, 10.001, 10.25, 10.5, 11].forEach((time) => {
      expect(resolveSonnetSegmentCameraFocus(withBackground, time)).toEqual(
        resolveSonnetSegmentCameraFocus(textGlyphs, time),
      );
    });
  });

  test("retains semantic non-text glyphs", () => {
    const staffLikeGlyph = { baseX: 240, baseY: 0, startTime: 12, isTextGlyph: false };
    expect(resolveSonnetCameraTrackingGlyphs([...textGlyphs, staffLikeGlyph])).toEqual([
      ...textGlyphs,
      staffLikeGlyph,
    ]);
  });
});
