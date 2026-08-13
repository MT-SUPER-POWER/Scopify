import { describe, expect, test } from "bun:test";

import {
  resolveShaderViewport,
  scalePixelSizedShaderUniform,
} from "@/lib/desktopPlaybackWallpaper/shaderViewport";

describe("shader viewport", () => {
  test("keeps native resolution when the CSS surface fits the pixel budget", () => {
    expect(
      resolveShaderViewport({
        cssHeight: 720,
        cssWidth: 1280,
        devicePixelRatio: 1,
        maxPixelCount: 1280 * 720,
      }),
    ).toEqual({
      aspectRatio: 1280 / 720,
      renderHeight: 720,
      renderScale: 1,
      renderWidth: 1280,
      uniformPixelScale: 1,
    });
  });

  test("uses CSS size, DPR, and the pixel budget to resolve a bounded render surface", () => {
    expect(
      resolveShaderViewport({
        cssHeight: 2160,
        cssWidth: 3840,
        devicePixelRatio: 2,
        maxPixelCount: 1280 * 720,
      }),
    ).toEqual({
      aspectRatio: 16 / 9,
      renderHeight: 720,
      renderScale: 1 / 6,
      renderWidth: 1280,
      uniformPixelScale: 1 / 6,
    });
  });

  test("compensates pixel-sized dithering uniforms down with a downsampled render surface", () => {
    const viewport = resolveShaderViewport({
      cssHeight: 1080,
      cssWidth: 1920,
      devicePixelRatio: 1,
      maxPixelCount: 960 * 540,
    });

    expect(viewport.renderScale).toBe(0.5);
    // A smaller internal surface magnifies shader pixels after compositing, so the
    // shader's pixel-sized uniform must become smaller too, never larger.
    expect(scalePixelSizedShaderUniform(8, viewport)).toBe(4);
  });

  test("handles a zero-sized surface without producing non-finite values", () => {
    expect(
      resolveShaderViewport({
        cssHeight: 0,
        cssWidth: 0,
        devicePixelRatio: 2,
        maxPixelCount: 1280 * 720,
      }),
    ).toEqual({
      aspectRatio: 1,
      renderHeight: 0,
      renderScale: 1,
      renderWidth: 0,
      uniformPixelScale: 1,
    });
  });
});
