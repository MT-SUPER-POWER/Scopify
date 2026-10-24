import type { BrowserWindow, Point, Rectangle } from "electron";
import type { DesktopPlaybackWallpaperService } from "@/types/service/desktop/wallpaper/service";
import type { PlaybackGateway } from "@/types/service/playback/gateway";

export interface TrayOptions {
  onMainWindowRequested?(): Promise<void> | void;
}

export interface TrayPanelOptions {
  window: Pick<
    BrowserWindow,
    | "isDestroyed"
    | "isVisible"
    | "isFocused"
    | "getSize"
    | "setPosition"
    | "show"
    | "hide"
    | "focus"
  >;
  getWorkArea(point: Point): Rectangle;
}

export interface MacTrayOptions {
  playback: Pick<
    PlaybackGateway,
    "dispatch" | "getSnapshot" | "next" | "previous" | "subscribe" | "toggle"
  >;
  getWallpaperService(): Pick<DesktopPlaybackWallpaperService, "configure" | "getModel"> | null;
  /** 显示主窗口；传入路由时同时让主窗口跳转。 */
  showMainWindow(path?: string): Promise<void> | void;
}

export type MacTrayLocale = "zh-CN" | "zh-TW" | "en-US";
