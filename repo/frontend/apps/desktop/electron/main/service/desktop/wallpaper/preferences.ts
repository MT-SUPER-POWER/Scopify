import type {
  PersistedDesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperPreferencesRepository,
  DesktopPlaybackWallpaperPreferencesRepositoryOptions,
} from "@/types/service/desktop/wallpaper/preferences";
export type {
  DesktopPlaybackWallpaperPreferencesRepository,
  DesktopPlaybackWallpaperPreferencesRepositoryOptions,
} from "@/types/service/desktop/wallpaper/preferences";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import {
  cloneDesktopPlaybackWallpaperPreferences,
  normalizeDesktopPlaybackWallpaperPreferences,
} from "@/types/desktopPlaybackWallpaper";

const PREFERENCES_VERSION = 1;

export function createDesktopPlaybackWallpaperPreferencesRepository({
  filePath,
  onError = () => undefined,
}: DesktopPlaybackWallpaperPreferencesRepositoryOptions): DesktopPlaybackWallpaperPreferencesRepository {
  return {
    load() {
      if (!existsSync(filePath)) return normalizeDesktopPlaybackWallpaperPreferences();

      try {
        const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
        if (isRecord(parsed) && parsed.version === PREFERENCES_VERSION) {
          return normalizeDesktopPlaybackWallpaperPreferences(parsed.preferences);
        }

        // Accept the unversioned foundation shape once, then write v1 on the next update.
        return normalizeDesktopPlaybackWallpaperPreferences(parsed);
      } catch (error) {
        onError("Failed to read desktop playback wallpaper preferences.", error);
        return normalizeDesktopPlaybackWallpaperPreferences();
      }
    },

    save(preferences) {
      const normalized = cloneDesktopPlaybackWallpaperPreferences(
        normalizeDesktopPlaybackWallpaperPreferences(preferences),
      );
      const persisted: PersistedDesktopPlaybackWallpaperPreferences = {
        preferences: normalized,
        version: PREFERENCES_VERSION,
      };
      const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

      try {
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(temporaryPath, JSON.stringify(persisted, null, 2), "utf-8");
        renameSync(temporaryPath, filePath);
      } catch (error) {
        onError("Failed to save desktop playback wallpaper preferences.", error);
        throw error;
      } finally {
        rmSync(temporaryPath, { force: true });
      }
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
