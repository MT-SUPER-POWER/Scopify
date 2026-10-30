import type { BrowserWindow, Rectangle } from "electron";
import type { DesktopPlaybackWallpaperSystemFallback } from "./systemWallpaperFallback";
import type { DesktopPlaybackWallpaperDriver } from "@/types/service/desktop/wallpaper/service";

export interface ActiveWallpaperProfile {
  bounds: Rectangle;
  displayId: string;
}

export interface MainWindowState {
  alwaysOnTop: boolean;
  bounds: Rectangle;
  fullScreen: boolean;
  maximized: boolean;
  minimized: boolean;
  minimumSize: [number, number];
  movable: boolean;
  resizable: boolean;
  visible: boolean;
}

export interface ElectronDesktopPlaybackWallpaperDriver extends DesktopPlaybackWallpaperDriver {
  isWallpaperActive(): boolean;
}

export interface ElectronDesktopPlaybackWallpaperDriverOptions {
  mainWindow: BrowserWindow;
  onHostLost?(diagnostic: string): void;
  systemWallpaperFallback?: DesktopPlaybackWallpaperSystemFallback | null;
}
