import type {
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperStatus,
} from "@scopifymusicplayer/desktop-contract";

import { cloneDesktopPlaybackWallpaperPreferences } from "../../../types/desktopPlaybackWallpaper.js";

export type DesktopPlaybackWallpaperSettledStatus = Exclude<
  DesktopPlaybackWallpaperStatus,
  { state: "inactive" } | { state: "starting" }
>;

export type DesktopPlaybackWallpaperEvent =
  | {
      preferences: DesktopPlaybackWallpaperPreferences;
      type: "preferences-updated";
    }
  | { type: "start-requested" }
  | {
      status: DesktopPlaybackWallpaperSettledStatus;
      type: "runtime-settled";
    };

export function hasVisibleDesktopPlaybackWallpaperIntent(
  preferences: DesktopPlaybackWallpaperPreferences,
) {
  return preferences.enabled && (preferences.layers.background || preferences.layers.lyrics);
}

export function getInactiveDesktopPlaybackWallpaperStatus(
  preferences: DesktopPlaybackWallpaperPreferences,
): Extract<DesktopPlaybackWallpaperStatus, { state: "inactive" }> | null {
  if (!preferences.enabled) return { reason: "disabled", state: "inactive" };
  if (!preferences.layers.background && !preferences.layers.lyrics) {
    return { reason: "no-visible-layer", state: "inactive" };
  }
  return null;
}

export function createDesktopPlaybackWallpaperModel(
  preferences: DesktopPlaybackWallpaperPreferences,
): DesktopPlaybackWallpaperModel {
  return {
    preferences: cloneDesktopPlaybackWallpaperPreferences(preferences),
    status: getInactiveDesktopPlaybackWallpaperStatus(preferences) ?? { state: "starting" },
  };
}

export function transitionDesktopPlaybackWallpaper(
  current: DesktopPlaybackWallpaperModel,
  event: DesktopPlaybackWallpaperEvent,
): DesktopPlaybackWallpaperModel {
  if (event.type === "preferences-updated") {
    return createDesktopPlaybackWallpaperModel(event.preferences);
  }

  const inactiveStatus = getInactiveDesktopPlaybackWallpaperStatus(current.preferences);
  if (inactiveStatus) {
    return cloneDesktopPlaybackWallpaperModel({
      ...current,
      status: inactiveStatus,
    });
  }

  if (event.type === "start-requested") {
    return cloneDesktopPlaybackWallpaperModel({
      ...current,
      status: { state: "starting" },
    });
  }

  return cloneDesktopPlaybackWallpaperModel({
    ...current,
    status: event.status,
  });
}

export function cloneDesktopPlaybackWallpaperModel(
  model: DesktopPlaybackWallpaperModel,
): DesktopPlaybackWallpaperModel {
  return {
    preferences: cloneDesktopPlaybackWallpaperPreferences(model.preferences),
    status: { ...model.status },
  };
}
