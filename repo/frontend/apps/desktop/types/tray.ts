import type { BrowserWindow, Point, Rectangle, Tray } from "electron";
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

/** 菜单栏展示开关：歌词与播放控制各自独立，都关掉时只剩应用图标。 */
export interface MacMenuBarPreferences {
  showLyrics: boolean;
  showControls: boolean;
}

export type MacTrayControlIconName = "heart" | "heartFilled" | "next" | "pause" | "play" | "prev";
export type MacTrayControlAction = "previous" | "toggle" | "next" | "like";

/** 每个控制按钮独占一个原生菜单栏项，支持独立点击与系统高亮。 */
export interface MacTrayStatusItems {
  logo: Tray;
  controls: Partial<Record<MacTrayControlAction, Tray>>;
  title: Tray | null;
}
