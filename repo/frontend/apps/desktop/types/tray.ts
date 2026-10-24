import type { BrowserWindow, Point, Rectangle } from "electron";
import type { DesktopPlaybackWallpaperService } from "@/types/service/desktop/wallpaper/service";
import type { PlaybackGateway } from "@/types/service/playback/gateway";
import type { PlaybackClockAnchor } from "@scopify/desktop-contract";

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
  getWallpaperService(): Pick<
    DesktopPlaybackWallpaperService,
    "configure" | "getModel" | "subscribe"
  > | null;
  /** 播放时钟锚点，用于在主进程推算当前进度（时间戳为 epoch 毫秒）。 */
  getPlaybackAnchor(): PlaybackClockAnchor | null;
  /** 显示主窗口；传入路由时同时让主窗口跳转。 */
  showMainWindow(path?: string): Promise<void> | void;
}

export type MacTrayLocale = "zh-CN" | "zh-TW" | "en-US";

/**
 * 菜单栏展示档位：
 * - lyrics：当前歌词（无歌词时回退为歌名 - 歌手）+ 播放控制
 * - full：歌名 - 歌手 + 播放控制
 * - compact：仅歌名 + 播放控制
 * - controls：仅播放控制
 * - icon：仅应用图标
 */
export type MacMenuBarDisplayMode = "lyrics" | "full" | "compact" | "controls" | "icon";
