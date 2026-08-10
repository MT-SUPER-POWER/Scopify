import type { BrowserWindow } from "electron";

export type SystemWallpaperFallbackOperationResult =
  | { changed: boolean; detail?: unknown; success: true }
  | { error: string; detail?: unknown; success: false };

export interface DesktopPlaybackWallpaperSystemFallback {
  apply(
    window: BrowserWindow,
    signal: AbortSignal,
  ): Promise<SystemWallpaperFallbackOperationResult>;
  dispose(): void;
  isApplied(): boolean;
  restore(reason: string, signal: AbortSignal): Promise<SystemWallpaperFallbackOperationResult>;
  restoreSync(reason: string): SystemWallpaperFallbackOperationResult;
}

export interface WindowsSystemWallpaperFallbackOptions {
  scriptPath?: string;
  stateDirectory?: string;
}
