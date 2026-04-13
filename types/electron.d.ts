import { AppConfig } from "@/types/config";
import { BackendStartupStatus } from "@/types/backend";

// Electron `preload.js` 暴露给前端的 API 类型声明
export interface ElectronAPI {
  relaunchApp: () => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  // ? callback 参数保留，以后开发可能用的上
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
  updateAppConfig: (config: DeepPartial<AppConfig>) => Promise<AppConfig>;
  getBackendStatus: () => Promise<BackendStartupStatus>;
  setCookie: (cookieStr: string) => Promise<boolean>;
  navigateTo: (path: string) => void;
  onNavigate: (callback: (path: string) => void) => void;
  loginSuccess: () => void;
  onControlAudio: (callback: (action: 'toggle-play' | 'next' | 'prev') => void) => void;
  onBackendStatusChanged: (callback: (status: BackendStartupStatus) => void) => void;
}

// 拓展全局 Window 对象，添加 electronAPI 属性
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
