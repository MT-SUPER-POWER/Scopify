import type {
  DesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@mt-super-power/desktop-contract";
import { DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES } from "@mt-super-power/desktop-contract";
import { z } from "zod";

const FULLSCREEN_POLICIES = ["keep-running", "pause", "stop"] as const;

function toRecord(value: unknown): Record<string, unknown> {
  return z.record(z.unknown()).safeParse(value).data ?? {};
}

function normalizedBoolean(defaultValue: boolean) {
  return z.preprocess(
    (value) => (typeof value === "boolean" ? value : undefined),
    z.boolean().default(defaultValue),
  );
}

export const desktopPlaybackWallpaperPreferencesSchema = z.preprocess(
  toRecord,
  z
    .object({
      enabled: normalizedBoolean(DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES.enabled),
      fullscreenPolicy: z
        .enum(FULLSCREEN_POLICIES)
        .catch(DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES.fullscreenPolicy),
      layers: z.preprocess(
        toRecord,
        z.object({
          background: normalizedBoolean(
            DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES.layers.background,
          ),
          lyrics: normalizedBoolean(DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES.layers.lyrics),
        }),
      ),
      systemWallpaperFallback: normalizedBoolean(
        DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES.systemWallpaperFallback,
      ),
    })
    .strip(),
);

const desktopPlaybackWallpaperLayersUpdateSchema = z
  .object({
    background: z.boolean().optional(),
    lyrics: z.boolean().optional(),
  })
  .strict()
  .refine((update) => Object.keys(update).length > 0, "A layer update cannot be empty.");

export const desktopPlaybackWallpaperPreferencesUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    fullscreenPolicy: z.enum(FULLSCREEN_POLICIES).optional(),
    layers: desktopPlaybackWallpaperLayersUpdateSchema.optional(),
    systemWallpaperFallback: z.boolean().optional(),
  })
  .strict()
  .refine((update) => Object.keys(update).length > 0, "A preferences update cannot be empty.");

export function normalizeDesktopPlaybackWallpaperPreferences(
  input?: unknown,
): DesktopPlaybackWallpaperPreferences {
  const preferences = desktopPlaybackWallpaperPreferencesSchema.parse(input ?? {});
  return cloneDesktopPlaybackWallpaperPreferences(preferences);
}

export function parseDesktopPlaybackWallpaperPreferencesUpdate(
  input: unknown,
): DesktopPlaybackWallpaperPreferencesUpdate {
  return desktopPlaybackWallpaperPreferencesUpdateSchema.parse(input);
}

export function applyDesktopPlaybackWallpaperPreferencesUpdate(
  current: DesktopPlaybackWallpaperPreferences,
  update: DesktopPlaybackWallpaperPreferencesUpdate,
): DesktopPlaybackWallpaperPreferences {
  return normalizeDesktopPlaybackWallpaperPreferences({
    ...current,
    ...update,
    layers: {
      ...current.layers,
      ...update.layers,
    },
  });
}

export function cloneDesktopPlaybackWallpaperPreferences(
  preferences: DesktopPlaybackWallpaperPreferences,
): DesktopPlaybackWallpaperPreferences {
  return {
    ...preferences,
    layers: { ...preferences.layers },
  };
}
