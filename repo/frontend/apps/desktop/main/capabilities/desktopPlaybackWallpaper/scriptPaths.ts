import { join } from "node:path";

export type DesktopPlaybackWallpaperScript = "host.ps1" | "system-wallpaper.ps1";

export interface DesktopPlaybackWallpaperScriptRuntime {
  appPath: string;
  isPackaged: boolean;
  resourcesPath: string;
}

export function resolveDesktopPlaybackWallpaperScriptPath(
  script: DesktopPlaybackWallpaperScript,
  runtime: DesktopPlaybackWallpaperScriptRuntime,
) {
  return runtime.isPackaged
    ? join(runtime.resourcesPath, "desktop-wallpaper-host-spike", script)
    : join(runtime.appPath, "prototypes", "desktop-wallpaper-host-spike", script);
}
