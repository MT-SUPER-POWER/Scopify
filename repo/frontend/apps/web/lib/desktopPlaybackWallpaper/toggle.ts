import type {
  DesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@mt-super-power/desktop-contract";

export function getDesktopPlaybackWallpaperToggleUpdate(
  preferences: DesktopPlaybackWallpaperPreferences,
): DesktopPlaybackWallpaperPreferencesUpdate {
  if (preferences.enabled) return { enabled: false };
  return { enabled: true };
}
