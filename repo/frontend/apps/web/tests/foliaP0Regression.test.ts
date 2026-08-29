import { describe, expect, test } from "bun:test";

import {
  setPixiDisplayTreeVisibility,
  unloadPixiDisplayTree,
} from "@/components/lyrics/folia/src/components/visualizer/pixiDisplayResources";
import { resolveMonetLargeScreenScale } from "@/components/lyrics/folia/src/components/visualizer/monet/monetLyricsModel";
import { shouldDrawSonnetSceneBackdrop } from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetSceneBuilder";
import { resolveVideoExportCropGeometry } from "@/lib/lyrics/videoExportCapture";

describe("Folia v0.7 correctness backports", () => {
  test("uses the Monet container width for large-screen scaling", () => {
    expect(resolveMonetLargeScreenScale(1200)).toBe(1);
    expect(resolveMonetLargeScreenScale(1536)).toBe(1);
    expect(resolveMonetLargeScreenScale(2200)).toBeCloseTo(1.16);
  });

  test("does not paint Sonnet's scene wash on a transparent surface", () => {
    expect(shouldDrawSonnetSceneBackdrop(true, true)).toBe(false);
    expect(shouldDrawSonnetSceneBackdrop(true, false)).toBe(true);
    expect(shouldDrawSonnetSceneBackdrop(false, false)).toBe(false);
  });

  test("releases retained Pixi descendants only when a tree becomes hidden", () => {
    let unloadCount = 0;
    const root = { visible: true, children: [{ unload: () => unloadCount++ }] };
    setPixiDisplayTreeVisibility(root, true);
    setPixiDisplayTreeVisibility(root, false);
    setPixiDisplayTreeVisibility(root, false);
    expect(unloadCount).toBe(1);
    unloadPixiDisplayTree(root);
    expect(unloadCount).toBe(2);
  });

  test("center-crops oversized captures and cover-crops aspect mismatches", () => {
    expect(resolveVideoExportCropGeometry(1928, 1088, 1920, 1080)).toEqual({
      sourceX: 4,
      sourceY: 4,
      sourceWidth: 1920,
      sourceHeight: 1080,
      mode: "pure-crop",
    });
    const portrait = resolveVideoExportCropGeometry(1920, 1080, 1080, 1920);
    expect(portrait.mode).toBe("cover");
    expect(portrait.sourceWidth / portrait.sourceHeight).toBeCloseTo(1080 / 1920, 2);
  });
});
