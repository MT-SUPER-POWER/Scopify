import type { DesktopPlaybackWallpaperPreferences } from "@scopify/desktop-contract";

export function shouldUseDesktopPlaybackWallpaperSystemFallback(
  preferences: DesktopPlaybackWallpaperPreferences,
) {
  return (
    preferences.enabled && preferences.layers.background && preferences.systemWallpaperFallback
  );
}
