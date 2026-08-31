import { expect, test } from "bun:test";

import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";

import { shouldRenderDesktopPlaybackWallpaper } from "@/lib/desktopPlaybackWallpaper/presentation";

const preferences = {
  enabled: true,
  fullscreenPolicy: "pause",
  layers: { background: true, lyrics: true },
  systemWallpaperFallback: false,
} as const;

test("renders the main window as a Stage-only wallpaper while its host is active", () => {
  expect(
    shouldRenderDesktopPlaybackWallpaper({ preferences, status: { state: "starting" } }),
  ).toBeTrue();
  expect(
    shouldRenderDesktopPlaybackWallpaper({
      preferences,
      status: { displayId: "primary", state: "running" },
    }),
  ).toBeTrue();
});

test("returns the main Renderer to application chrome when wallpaper hosting is unavailable", () => {
  const faulted: DesktopPlaybackWallpaperModel = {
    preferences,
    status: { diagnostic: "attach failed", retryable: true, state: "faulted" },
  };

  expect(shouldRenderDesktopPlaybackWallpaper(faulted)).toBeFalse();
  expect(
    shouldRenderDesktopPlaybackWallpaper({
      preferences: { ...preferences, enabled: false },
      status: { reason: "disabled", state: "inactive" },
    }),
  ).toBeFalse();
});
