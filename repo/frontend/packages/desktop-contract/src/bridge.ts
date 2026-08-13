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
import type { DiscordPresenceSnapshot, DiscordPresenceStatus } from "./discord";
import type { PlaybackTransportPayload, PlaybackTransportRole } from "./playback";
import type { PlaybackHostClientCommand, PlaybackHostHostMessage } from "./playbackHostControl";

export const DESKTOP_BRIDGE_PROTOCOL_VERSION = 14;

export type DesktopBridgeCapability =
  | "app-lifecycle"
  | "audio-feature-transport"
  | "cache"
  | "config"
  | "desktop-icons"
  | "desktop-lyrics"
  | "desktop-playback-wallpaper"
  | "discord-presence"
  | "login"
  | "logs"
  | "media-controls"
  | "navigation"
  | "playback-transport"
  | "playback-host-control"
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
  /** Connects the main renderer's low-frequency client control channel. */
  connectPlaybackHostControl(
    connectionId: string,
    onPayload: (payload: PlaybackHostHostMessage) => void,
    onClose: () => void,
  ): Unsubscribe;
  deletePageCache(key: string): Promise<boolean>;
  downloadUpdate(): Promise<AppUpdateState>;
  enterFullScreen(): void;
  exitApp(): void;
  exitFullScreen(): void;
  getDiscordPresenceStatus(): Promise<DiscordPresenceStatus>;
  getHostConfig(): Promise<DesktopHostConfig>;
  getBridgeInfo(): Promise<DesktopBridgeInfo>;
  getLogDirectory(): Promise<string>;
  getDesktopIconVisibility(): Promise<DesktopIconVisibilityState>;
  getDesktopLyricPreferences(): Promise<DesktopLyricPreferences | null>;
  getDesktopPlaybackWallpaperModel(): Promise<DesktopPlaybackWallpaperModel>;
  getPageCache<T = unknown>(key: string): Promise<T | null>;
  getPageCacheStats(): Promise<PageCacheStats>;
  getUpdateStatus(): Promise<AppUpdateState>;
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
  openLoginWindow(): void;
  publishAudioFeatureFrame(frame: AudioFeatureFrameV1): boolean;
  publishDiscordPresenceSnapshot(snapshot: DiscordPresenceSnapshot): Promise<DiscordPresenceStatus>;
  testDiscordPresenceConnection(): Promise<DiscordPresenceStatus>;
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
  setPlayerPlaying(isPlaying: boolean): void;
  sendPlaybackTransportPayload(payload: PlaybackTransportPayload<TLyrics>): boolean;
  /** Sends a versioned Main→Host command; the Host owns every queue mutation. */
  sendPlaybackHostControlPayload(payload: PlaybackHostClientCommand): boolean;
  updateHostConfig(config: DesktopHostConfig): Promise<DesktopHostConfig>;
  updateDesktopLyricPreferences(
    update: DesktopLyricPreferencesUpdate,
  ): Promise<DesktopLyricPreferences | null>;
  updateDesktopPlaybackWallpaperPreferences(
    update: DesktopPlaybackWallpaperPreferencesUpdate,
  ): Promise<DesktopPlaybackWallpaperModel>;
  writeLog(event: RendererLogEvent): Promise<boolean>;
}
