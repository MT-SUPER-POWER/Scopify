import { describe, expect, test } from "bun:test";

import { downsampleSpectrum } from "@/lib/desktopPlaybackWallpaper/playback";
import { getDesktopPlaybackWallpaperToggleUpdate } from "@/lib/desktopPlaybackWallpaper/toggle";

describe("desktop wallpaper Folia playback feed", () => {
  test("downsamples spectrum deterministically and handles a zero bin budget", () => {
    expect(downsampleSpectrum([0, 1, 2, 3, 4, 5, 6, 7], 4)).toEqual([0, 2, 4, 6]);
    expect(downsampleSpectrum([1, 2], 4)).toEqual([1, 2]);
    expect(downsampleSpectrum([1, 2], 0)).toEqual([]);
  });

  test("does not opt into the static Windows Shell fallback from the PlayBar", () => {
    const preferences = {
      enabled: false,
      fullscreenPolicy: "pause" as const,
      layers: { background: true, lyrics: true },
      systemWallpaperFallback: false,
    };

    expect(getDesktopPlaybackWallpaperToggleUpdate(preferences)).toEqual({
      enabled: true,
    });
    expect(
      getDesktopPlaybackWallpaperToggleUpdate({
        ...preferences,
        enabled: true,
        systemWallpaperFallback: true,
      }),
    ).toEqual({ enabled: false });
  });
});
