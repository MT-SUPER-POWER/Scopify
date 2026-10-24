import type { BrowserWindow, Rectangle } from "electron";
import type { NativeDesktopIconState } from "./desktopIconVisibility";
import type { SystemWallpaperFallbackOperationResult } from "./systemWallpaperFallback";

/** Main-only Node-API ABI shared by the Rust platform backends. Never exposed to Preload. */
export interface NativeWallpaperModule {
  attach(
    handle: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    primaryHeight: number,
  ): void;
  detach(): void;
  pollEvents(): string[];
  isAttached(): boolean;
  getDesktopIconVisibility(): Promise<NativeDesktopIconState>;
  setDesktopIconVisibility(visible: boolean): Promise<NativeDesktopIconState>;
  applySystemWallpaper(
    imagePath: string,
    journalPath: string,
  ): Promise<SystemWallpaperFallbackOperationResult>;
  restoreSystemWallpaper(journalPath: string): Promise<SystemWallpaperFallbackOperationResult>;
  restoreSystemWallpaperSync(journalPath: string): SystemWallpaperFallbackOperationResult;
}

export type NativeWallpaperSessionModule = Pick<
  NativeWallpaperModule,
  "attach" | "detach" | "pollEvents" | "isAttached"
>;

export interface NativeWallpaperAttachment {
  hwnd: number;
  mode: "classic" | "raised" | "macos-desktop";
  workerW: number;
}

export interface NativeWallpaperSession {
  attach(
    handle: Buffer,
    bounds: Rectangle,
    primaryHeight: number,
    signal: AbortSignal,
  ): Promise<NativeWallpaperAttachment>;
  detach(): Promise<boolean>;
  dispose(): Promise<void>;
  isAttached(): boolean;
}

export interface NativeWallpaperHost {
  attach(window: BrowserWindow, signal: AbortSignal): Promise<NativeWallpaperAttachment>;
  detach(signal?: AbortSignal): Promise<boolean>;
  dispose(): Promise<void>;
  isAttached(): boolean;
}

export interface NativeWallpaperHostOptions {
  onLost?(diagnostic: string): void;
}

export interface NativeWallpaperSessionOptions extends NativeWallpaperHostOptions {
  attachTimeoutMs?: number;
  detachTimeoutMs?: number;
  pollIntervalMs?: number;
}

export interface PendingNativeWallpaperAttach {
  resolve(attachment: NativeWallpaperAttachment): void;
  reject(error: Error): void;
}

export interface MacWallpaperWindowState {
  bounds: Rectangle;
  minimumSize: [number, number];
  movable: boolean;
  resizable: boolean;
  visible: boolean;
  maximized: boolean;
  minimized: boolean;
  fullScreen: boolean;
  simpleFullScreen: boolean;
}
