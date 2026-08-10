import { describe, expect, test } from "bun:test";

import {
  DESKTOP_WALLPAPER_PRESENTATION_STALE_MS,
  downsampleSpectrum,
  getDesktopWallpaperPlaybackTimeMs,
  shouldPublishDesktopWallpaperPresentation,
} from "@/lib/desktopPlaybackWallpaper/playback";
import { getDesktopPlaybackWallpaperToggleUpdate } from "@/lib/desktopPlaybackWallpaper/toggle";
import type { DesktopLyricSnapshot } from "@/types/desktopLyric";

function createPresentation(overrides: Partial<DesktopLyricSnapshot> = {}): DesktopLyricSnapshot {
  return {
    isLiked: false,
    isPlaying: true,
    lyrics: null,
    positionMs: 10_000,
    track: {
      artistNames: ["Folia"],
      durationMs: 180_000,
      id: 1,
      title: "Desktop",
    },
    updatedAt: 1_000,
    ...overrides,
  };
}

describe("desktop wallpaper Folia playback feed", () => {
  test("publishes a forced track snapshot even while the wallpaper is inactive", () => {
    expect(shouldPublishDesktopWallpaperPresentation(false, true, 0, 250)).toBeTrue();
    expect(shouldPublishDesktopWallpaperPresentation(false, false, 250, 250)).toBeFalse();
    expect(shouldPublishDesktopWallpaperPresentation(true, false, 249, 250)).toBeFalse();
    expect(shouldPublishDesktopWallpaperPresentation(true, false, 250, 250)).toBeTrue();
  });

  test("interpolates a live snapshot and freezes once the publisher becomes stale", () => {
    const presentation = createPresentation();

    expect(getDesktopWallpaperPlaybackTimeMs(presentation, 1_250)).toBe(10_250);
    expect(getDesktopWallpaperPlaybackTimeMs(presentation, 20_000)).toBe(
      10_000 + DESKTOP_WALLPAPER_PRESENTATION_STALE_MS,
    );
  });

  test("holds paused playback and clamps interpolation to the track duration", () => {
    expect(
      getDesktopWallpaperPlaybackTimeMs(createPresentation({ isPlaying: false }), 20_000),
    ).toBe(10_000);
    expect(
      getDesktopWallpaperPlaybackTimeMs(
        createPresentation({
          positionMs: 179_800,
          track: {
            artistNames: [],
            durationMs: 180_000,
            id: 1,
            title: "Desktop",
          },
        }),
        1_500,
      ),
    ).toBe(180_000);
  });

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
