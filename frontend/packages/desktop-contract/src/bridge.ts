import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopLyricSnapshot,
  DesktopLyricSnapshotInput,
} from "./desktopLyrics";
import type { RendererLogEvent } from "./logging";
import type { AppUpdateState } from "./updater";

export const DESKTOP_BRIDGE_PROTOCOL_VERSION = 1;

export type DesktopBridgeCapability =
  | "app-lifecycle"
  | "cache"
  | "config"
  | "desktop-lyrics"
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

export interface DesktopBridge<TConfig = unknown, TLyrics = unknown> {
  checkForUpdates(): Promise<AppUpdateState>;
  clearPageCache(): Promise<PageCacheStats>;
  closeDesktopLyric(): Promise<boolean>;
  deletePageCache(key: string): Promise<boolean>;
  downloadUpdate(): Promise<AppUpdateState>;
  enterFullScreen(): void;
  exitApp(): void;
  exitFullScreen(): void;
  getAppConfig(): Promise<TConfig>;
  getBridgeInfo(): Promise<DesktopBridgeInfo>;
  getDesktopLyricPreferences(): Promise<DesktopLyricPreferences | null>;
  getDesktopLyricSnapshot(): Promise<DesktopLyricSnapshot<TLyrics> | null>;
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
  onFullScreenChanged(callback: (isFullScreen: boolean) => void): Unsubscribe;
  onNavigate(callback: (path: string) => void): Unsubscribe;
  onUpdateStatusChanged(callback: (status: AppUpdateState) => void): Unsubscribe;
  openLoginWindow(): void;
  publishDesktopLyricSnapshot(
    snapshot: DesktopLyricSnapshotInput<TLyrics>,
  ): Promise<DesktopLyricSnapshot<TLyrics> | null>;
  quitAndInstallUpdate(): void;
  relaunchApp(): void;
  sendAppCloseAction(action: "exit" | "minimize"): void;
  sendDesktopLyricCommand(command: DesktopLyricCommand): void;
  setCookie(cookie: string): Promise<boolean>;
  setPageCache<T = unknown>(key: string, value: T, ttlMs: number): Promise<boolean>;
  setPlayerPlaying(isPlaying: boolean): void;
  updateAppConfig(config: TConfig): Promise<TConfig>;
  updateDesktopLyricPreferences(
    update: DesktopLyricPreferencesUpdate,
  ): Promise<DesktopLyricPreferences | null>;
  writeLog(event: RendererLogEvent): Promise<boolean>;
}
