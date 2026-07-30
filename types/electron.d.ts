import type { BackendStartupStatus } from "@/types/backend";
import type { AppConfig } from "@/types/config";
import type { RendererLogEvent } from "@/types/logging";
import type { AppUpdateState } from "@/types/updater";
import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopLyricSnapshot,
  DesktopLyricSnapshotInput,
  DesktopLyricSnapshotUpdate,
} from "@/types/desktopLyric";

export interface PageCacheStats {
  dir: string;
  entryCount: number;
  sizeBytes: number;
}

export interface ElectronAPI {
  relaunchApp: () => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback?: (...args: unknown[]) => void) => void;
  send: (channel: string, args?: unknown) => void;
  enterFullScreen: () => void;
  exitFullScreen: () => void;
  onFullScreenChanged: (callback: (isFullScreen: boolean) => void) => void;
  openLoginWindow: () => void;
  closeLoginWindow: () => void;
  mainWindowReload: () => void;
  exitApp: () => void;
  minimizeApp: () => void;
  sendAppCloseAction: (action: "minimize" | "exit") => void;
  getAppConfig: () => Promise<AppConfig>;
  updateAppConfig: (config: AppConfig) => Promise<AppConfig>;
  writeLog: (event: RendererLogEvent) => Promise<boolean>;
  getPageCache: <T = unknown>(key: string) => Promise<T | null>;
  setPageCache: <T = unknown>(key: string, value: T, ttlMs: number) => Promise<boolean>;
  deletePageCache: (key: string) => Promise<boolean>;
  clearPageCache: () => Promise<PageCacheStats>;
  getPageCacheStats: () => Promise<PageCacheStats>;
  getBackendStatus: () => Promise<BackendStartupStatus>;
  getUpdateStatus: () => Promise<AppUpdateState>;
  checkForUpdates: () => Promise<AppUpdateState>;
  downloadUpdate: () => Promise<AppUpdateState>;
  quitAndInstallUpdate: () => void;
  setCookie: (cookieStr: string) => Promise<boolean>;
  navigateTo: (path: string) => void;
  onNavigate: (callback: (path: string) => void) => void;
  loginSuccess: () => void;
  onControlAudio: (callback: (action: "toggle-play" | "next" | "prev") => void) => void;
  onBackendStatusChanged: (callback: (status: BackendStartupStatus) => void) => void;
  onUpdateStatusChanged: (callback: (status: AppUpdateState) => void) => () => void;
  openDesktopLyric: () => Promise<boolean>;
  toggleDesktopLyric: () => Promise<boolean>;
  closeDesktopLyric: () => Promise<boolean>;
  getDesktopLyricSnapshot: () => Promise<DesktopLyricSnapshot | null>;
  publishDesktopLyricSnapshot: (
    snapshot: DesktopLyricSnapshotInput,
  ) => Promise<DesktopLyricSnapshot | null>;
  updateDesktopLyricSnapshot: (
    update: DesktopLyricSnapshotUpdate,
  ) => Promise<DesktopLyricSnapshot | null>;
  getDesktopLyricPreferences: () => Promise<DesktopLyricPreferences | null>;
  updateDesktopLyricPreferences: (
    update: DesktopLyricPreferencesUpdate,
  ) => Promise<DesktopLyricPreferences | null>;
  sendDesktopLyricCommand: (command: DesktopLyricCommand) => void;
  onDesktopLyricSnapshot: (callback: (snapshot: DesktopLyricSnapshot) => void) => () => void;
  onDesktopLyricPreferences: (
    callback: (preferences: DesktopLyricPreferences) => void,
  ) => () => void;
  onDesktopLyricCommand: (callback: (command: DesktopLyricCommand) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
