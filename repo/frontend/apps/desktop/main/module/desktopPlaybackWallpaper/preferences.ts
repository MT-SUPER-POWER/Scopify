import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { DesktopPlaybackWallpaperPreferences } from "@scopify/desktop-contract";

import {
  cloneDesktopPlaybackWallpaperPreferences,
  normalizeDesktopPlaybackWallpaperPreferences,
} from "../../../types/desktopPlaybackWallpaper.js";

const PREFERENCES_VERSION = 1;

interface PersistedDesktopPlaybackWallpaperPreferences {
  preferences: DesktopPlaybackWallpaperPreferences;
  version: typeof PREFERENCES_VERSION;
}

export interface DesktopPlaybackWallpaperPreferencesRepository {
  load(): DesktopPlaybackWallpaperPreferences;
  save(preferences: DesktopPlaybackWallpaperPreferences): void;
}

export interface DesktopPlaybackWallpaperPreferencesRepositoryOptions {
  filePath: string;
  onError?: (message: string, error: unknown) => void;
}

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
