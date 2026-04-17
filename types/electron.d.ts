import type { AppConfig } from "@/types/config";
import type { BackendStartupStatus } from "@/types/backend";

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
  getBackendStatus: () => Promise<BackendStartupStatus>;
  setCookie: (cookieStr: string) => Promise<boolean>;
  navigateTo: (path: string) => void;
  onNavigate: (callback: (path: string) => void) => void;
  loginSuccess: () => void;
  onControlAudio: (callback: (action: "toggle-play" | "next" | "prev") => void) => void;
  onBackendStatusChanged: (callback: (status: BackendStartupStatus) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
