import type {
  DesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopifymusicplayer/desktop-contract";

export function getDesktopPlaybackWallpaperToggleUpdate(
  preferences: DesktopPlaybackWallpaperPreferences,
): DesktopPlaybackWallpaperPreferencesUpdate {
  if (preferences.enabled) return { enabled: false };
  return { enabled: true };
}
