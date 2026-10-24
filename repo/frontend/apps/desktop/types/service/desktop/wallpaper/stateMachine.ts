import type {
  DesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperStatus,
} from "@scopify/desktop-contract";
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
