import type { BrowserWindow } from "electron";
import type { DesktopPlaybackControllerLayout } from "@scopify/desktop-contract";
import type {
  DesktopPlaybackControllerLauncher,
  DesktopPlaybackWallpaperDriver,
} from "@/types/service/desktop/wallpaper/service";
export interface DesktopPlaybackControllerHost extends DesktopPlaybackControllerLauncher {
  setLayout(layout: DesktopPlaybackControllerLayout): boolean;
}

export interface DesktopPlaybackWallpaperServiceHostOptions {
  controller?: DesktopPlaybackControllerHost;
  driver?: DesktopPlaybackWallpaperDriver;
  getControllerWindow?: () => BrowserWindow | null;
  preferencesFilePath?: string;
}
