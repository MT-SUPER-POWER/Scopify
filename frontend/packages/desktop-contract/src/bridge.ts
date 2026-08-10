import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopLyricSnapshot,
  DesktopLyricSnapshotInput,
} from "./desktopLyrics";
import type { DesktopIconVisibilityState } from "./desktopIcons";
import type {
  DesktopPlaybackControllerOpenResult,
  DesktopPlaybackWallpaperAudioFrame,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPresentation,
  DesktopPlaybackWallpaperPresentationInput,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "./desktopPlaybackWallpaper";
import type { RendererLogEvent } from "./logging";
import type { AppUpdateState } from "./updater";
import type { DesktopHostConfig } from "./config";

export const DESKTOP_BRIDGE_PROTOCOL_VERSION = 3;

export type DesktopBridgeCapability =
  | "app-lifecycle"
  | "cache"
  | "config"
  | "desktop-icons"
  | "desktop-lyrics"
  | "desktop-playback-wallpaper"
  | "login"
  | "media-controls"
  | "navigation"
  | "renderer-logging"
  | "updates"
  | "window-controls";

export interface DesktopBridgeInfo {
  capabilities: DesktopBridgeCapability[];
  desktopVersion: string;
  electronVersion: string;
  protocolVersion: number;
}

export interface PageCacheStats {
  dir: string;
  entryCount: number;
  sizeBytes: number;
}

export type Unsubscribe = () => void;

export interface DesktopBridge<TLyrics = unknown> {
  checkForUpdates(): Promise<AppUpdateState>;
  clearPageCache(): Promise<PageCacheStats>;
  closeDesktopLyric(): Promise<boolean>;
  closeDesktopPlaybackController(): Promise<boolean>;
  deletePageCache(key: string): Promise<boolean>;
  downloadUpdate(): Promise<AppUpdateState>;
  enterFullScreen(): void;
  exitApp(): void;
  exitFullScreen(): void;
  getHostConfig(): Promise<DesktopHostConfig>;
  getBridgeInfo(): Promise<DesktopBridgeInfo>;
  getDesktopIconVisibility(): Promise<DesktopIconVisibilityState>;
  getDesktopLyricPreferences(): Promise<DesktopLyricPreferences | null>;
  getDesktopLyricSnapshot(): Promise<DesktopLyricSnapshot<TLyrics> | null>;
  getDesktopPlaybackWallpaperModel(): Promise<DesktopPlaybackWallpaperModel>;
  getDesktopPlaybackWallpaperPresentation(): Promise<DesktopPlaybackWallpaperPresentation<TLyrics> | null>;
  getPageCache<T = unknown>(key: string): Promise<T | null>;
  getPageCacheStats(): Promise<PageCacheStats>;
  getUpdateStatus(): Promise<AppUpdateState>;
  loginSuccess(): void;
  minimizeApp(): void;
  navigateTo(path: string): void;
  onAppCloseRequested(callback: () => void): Unsubscribe;
  onControlAudio(callback: (action: "next" | "prev" | "toggle-play") => void): Unsubscribe;
  onDesktopLyricCommand(callback: (command: DesktopLyricCommand) => void): Unsubscribe;
  onDesktopLyricSnapshot(callback: (snapshot: DesktopLyricSnapshot<TLyrics>) => void): Unsubscribe;
  onDesktopPlaybackWallpaperModelChanged(
    callback: (model: DesktopPlaybackWallpaperModel) => void,
  ): Unsubscribe;
  onDesktopPlaybackWallpaperAudioFrame(
    callback: (frame: DesktopPlaybackWallpaperAudioFrame) => void,
  ): Unsubscribe;
  onDesktopPlaybackWallpaperPresentationChanged(
    callback: (presentation: DesktopPlaybackWallpaperPresentation<TLyrics>) => void,
  ): Unsubscribe;
  onFullScreenChanged(callback: (isFullScreen: boolean) => void): Unsubscribe;
  onNavigate(callback: (path: string) => void): Unsubscribe;
  onUpdateStatusChanged(callback: (status: AppUpdateState) => void): Unsubscribe;
  openLoginWindow(): void;
  publishDesktopLyricSnapshot(
    snapshot: DesktopLyricSnapshotInput<TLyrics>,
  ): Promise<DesktopLyricSnapshot<TLyrics> | null>;
  publishDesktopPlaybackWallpaperAudioFrame(frame: DesktopPlaybackWallpaperAudioFrame): void;
  publishDesktopPlaybackWallpaperPresentation(
    presentation: DesktopPlaybackWallpaperPresentationInput<TLyrics>,
  ): Promise<DesktopPlaybackWallpaperPresentation<TLyrics> | null>;
  quitAndInstallUpdate(): void;
  relaunchApp(): void;
  retryDesktopPlaybackWallpaper(): Promise<DesktopPlaybackWallpaperModel>;
  sendAppCloseAction(action: "exit" | "minimize"): void;
  sendDesktopLyricCommand(command: DesktopLyricCommand): void;
  showDesktopPlaybackController(): Promise<DesktopPlaybackControllerOpenResult>;
  setCookie(cookie: string, backendOrigin: string): Promise<boolean>;
  setDesktopIconVisibility(visible: boolean): Promise<DesktopIconVisibilityState>;
  setPageCache<T = unknown>(key: string, value: T, ttlMs: number): Promise<boolean>;
  setPlayerPlaying(isPlaying: boolean): void;
  updateHostConfig(config: DesktopHostConfig): Promise<DesktopHostConfig>;
  updateDesktopLyricPreferences(
    update: DesktopLyricPreferencesUpdate,
  ): Promise<DesktopLyricPreferences | null>;
  updateDesktopPlaybackWallpaperPreferences(
    update: DesktopPlaybackWallpaperPreferencesUpdate,
  ): Promise<DesktopPlaybackWallpaperModel>;
  writeLog(event: RendererLogEvent): Promise<boolean>;
}
