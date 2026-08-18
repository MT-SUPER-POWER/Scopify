import type { AudioFeatureFrameV1, AudioFeatureTransportRole } from "./audioFeature";
import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
} from "./desktopLyrics";
import type { DesktopIconVisibilityState } from "./desktopIcons";
import type {
  DesktopPlaybackControllerLayout,
  DesktopPlaybackControllerOpenResult,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "./desktopPlaybackWallpaper";
import type { RendererLogEvent } from "./logging";
import type { AppUpdateState } from "./updater";
import type { DesktopHostConfig } from "./config";
import type { DesktopBackendStatus } from "./backend";
import type { DiscordPresenceSnapshot, DiscordPresenceStatus } from "./discord";
import type { PlaybackTransportPayload, PlaybackTransportRole } from "./playback";
import type {
  CacheCategory,
  CacheScope,
  ClearDesktopCacheRequest,
  DesktopCacheStats,
} from "./cache";

export const DESKTOP_BRIDGE_PROTOCOL_VERSION = 20;

export interface DesktopVideoExportSource {
  id: string;
  name: string;
}

export interface DesktopVideoExportSaveRequest {
  defaultPath: string;
  extension: "mp4" | "webm";
  formatName: string;
}

export type DesktopBridgeCapability =
  | "app-lifecycle"
  | "backend"
  | "audio-feature-transport"
  | "cache"
  | "config"
  | "developer-tools"
  | "desktop-icons"
  | "desktop-lyrics"
  | "desktop-playback-wallpaper"
  | "discord-presence"
  | "login"
  | "logs"
  | "media-controls"
  | "navigation"
  | "playback-transport"
  | "renderer-logging"
  | "updates"
  | "video-export"
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
  getBackendStatus(): Promise<DesktopBackendStatus>;
  checkForUpdates(): Promise<AppUpdateState>;
  clearCache(request: ClearDesktopCacheRequest): Promise<DesktopCacheStats>;
  clearPageCache(): Promise<PageCacheStats>;
  closeDesktopLyric(): Promise<boolean>;
  openDesktopLyric(): Promise<boolean>;
  toggleDesktopLyric(): Promise<boolean>;
  closeDesktopPlaybackController(): Promise<boolean>;
  connectAudioFeatureTransport(
    role: AudioFeatureTransportRole,
    connectionId: string,
    onFrame: (frame: AudioFeatureFrameV1) => void,
    onClose: () => void,
  ): Unsubscribe;
  connectPlaybackTransport(
    role: PlaybackTransportRole,
    connectionId: string,
    onPayload: (payload: PlaybackTransportPayload<TLyrics>) => void,
    onClose: () => void,
  ): Unsubscribe;
  deletePageCache(key: string): Promise<boolean>;
  deleteCache(scope: CacheScope, key: string): Promise<boolean>;
  downloadUpdate(): Promise<AppUpdateState>;
  enterFullScreen(): void;
  exitApp(): void;
  exitFullScreen(): void;
  getDiscordPresenceStatus(): Promise<DiscordPresenceStatus>;
  getHostConfig(): Promise<DesktopHostConfig>;
  getBridgeInfo(): Promise<DesktopBridgeInfo>;
  getLogDirectory(): Promise<string>;
  openCurrentLog(): Promise<boolean>;
  openLogDirectory(): Promise<boolean>;
  getDesktopIconVisibility(): Promise<DesktopIconVisibilityState>;
  getDesktopLyricPreferences(): Promise<DesktopLyricPreferences | null>;
  getDesktopPlaybackWallpaperModel(): Promise<DesktopPlaybackWallpaperModel>;
  getPageCache<T = unknown>(key: string): Promise<T | null>;
  getPageCacheStats(): Promise<PageCacheStats>;
  getCache<T = unknown>(scope: CacheScope, key: string): Promise<T | null>;
  getCacheStats(): Promise<DesktopCacheStats>;
  getMusicCookie?(): string | null;
  getUpdateStatus(): Promise<AppUpdateState>;
  getVideoExportCaptureSource(): Promise<DesktopVideoExportSource | null>;
  loginSuccess(): void;
  minimizeApp(): void;
  navigateTo(path: string): void;
  onControlAudio(callback: (action: "next" | "prev" | "toggle-play") => void): Unsubscribe;
  onDesktopLyricCommand(callback: (command: DesktopLyricCommand) => void): Unsubscribe;
  onDesktopPlaybackWallpaperModelChanged(
    callback: (model: DesktopPlaybackWallpaperModel) => void,
  ): Unsubscribe;
  onDiscordPresenceStatusChanged(callback: (status: DiscordPresenceStatus) => void): Unsubscribe;
  onFullScreenChanged(callback: (isFullScreen: boolean) => void): Unsubscribe;
  onNavigate(callback: (path: string) => void): Unsubscribe;
  onUpdateStatusChanged(callback: (status: AppUpdateState) => void): Unsubscribe;
  onBackendStatusChanged(callback: (status: DesktopBackendStatus) => void): Unsubscribe;
  openLoginWindow(): void;
  publishAudioFeatureFrame(frame: AudioFeatureFrameV1): boolean;
  publishDiscordPresenceSnapshot(snapshot: DiscordPresenceSnapshot): Promise<DiscordPresenceStatus>;
  testDiscordPresenceConnection(): Promise<DiscordPresenceStatus>;
  toggleDeveloperTools(): Promise<boolean>;
  quitAndInstallUpdate(): void;
  relaunchApp(): void;
  retryDesktopPlaybackWallpaper(): Promise<DesktopPlaybackWallpaperModel>;
  sendAppCloseAction(action: "exit" | "minimize" | "cancel"): void;
  sendDesktopLyricCommand(command: DesktopLyricCommand): void;
  setDesktopPlaybackControllerLayout(layout: DesktopPlaybackControllerLayout): Promise<boolean>;
  showDesktopPlaybackController(): Promise<DesktopPlaybackControllerOpenResult>;
  setCookie(cookie: string, backendOrigin: string): Promise<boolean>;
  setDesktopIconVisibility(visible: boolean): Promise<DesktopIconVisibilityState>;
  setPageCache<T = unknown>(key: string, value: T, ttlMs: number): Promise<boolean>;
  setCache<T = unknown>(
    scope: CacheScope,
    key: string,
    value: T,
    ttlMs: number,
    category?: CacheCategory,
  ): Promise<boolean>;
  setPlayerPlaying(isPlaying: boolean): void;
  selectDirectory(defaultPath?: string): Promise<string | null>;
  prepareVideoExportWindow(size: { width: number; height: number }): Promise<boolean>;
  restoreVideoExportWindow(): Promise<boolean>;
  selectVideoExportFile(request: DesktopVideoExportSaveRequest): Promise<string | null>;
  writeVideoExportFile(filePath: string, data: ArrayBuffer): Promise<boolean>;
  sendPlaybackTransportPayload(payload: PlaybackTransportPayload<TLyrics>): boolean;
  updateHostConfig(config: DesktopHostConfig): Promise<DesktopHostConfig>;
  updateDesktopLyricPreferences(
    update: DesktopLyricPreferencesUpdate,
  ): Promise<DesktopLyricPreferences | null>;
  updateDesktopPlaybackWallpaperPreferences(
    update: DesktopPlaybackWallpaperPreferencesUpdate,
  ): Promise<DesktopPlaybackWallpaperModel>;
  writeLog(event: RendererLogEvent): Promise<boolean>;
}
