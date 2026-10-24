import type { DesktopPlaybackWallpaperPreferences } from "@scopify/desktop-contract";
export interface PersistedDesktopPlaybackWallpaperPreferences {
  preferences: DesktopPlaybackWallpaperPreferences;
  version: 1;
}

export interface DesktopPlaybackWallpaperPreferencesRepository {
  load(): DesktopPlaybackWallpaperPreferences;
  save(preferences: DesktopPlaybackWallpaperPreferences): void;
}

export interface DesktopPlaybackWallpaperPreferencesRepositoryOptions {
  filePath: string;
  onError?: (message: string, error: unknown) => void;
}
