import type { BackendStartupStatus } from "@/types/backend";
import type { AppConfig } from "@/types/config";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
}

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
  getPageCache: <T = unknown>(key: string) => Promise<T | null>;
  setPageCache: <T = unknown>(key: string, value: T, ttlMs: number) => Promise<boolean>;
  deletePageCache: (key: string) => Promise<boolean>;
  clearPageCache: () => Promise<PageCacheStats>;
  getPageCacheStats: () => Promise<PageCacheStats>;
  getBackendStatus: () => Promise<BackendStartupStatus>;
  getUpdateStatus: () => Promise<UpdateState>;
  checkForUpdates: () => Promise<unknown>;
  downloadUpdate: () => Promise<unknown>;
  quitAndInstallUpdate: () => void;
  setCookie: (cookieStr: string) => Promise<boolean>;
  navigateTo: (path: string) => void;
  onNavigate: (callback: (path: string) => void) => void;
  loginSuccess: () => void;
  onControlAudio: (callback: (action: "toggle-play" | "next" | "prev") => void) => void;
  onBackendStatusChanged: (callback: (status: BackendStartupStatus) => void) => void;
  onUpdateStatusChanged: (callback: (status: UpdateState) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
