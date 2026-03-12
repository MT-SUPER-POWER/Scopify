import { AppConfig } from "@/types/config";

// Electron `preload.js` 暴露给前端的 API 类型声明
export interface ElectronAPI {
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  send: (channel: string, args?: unknown) => void;
  enterFullScreen: () => void;
  exitFullScreen: () => void;
  onFullScreenChanged: (callback: (isFullScreen: boolean) => void) => void;
  openLoginWindow: () => void;
  closeLoginWindow: () => void;
  maniWindowReload: () => void;
  exitApp: () => void;
  minimizeApp: () => void;
  sendAppCloseAction: (action: "minimize" | "exit") => void;
  // TODO: 配合 yaml
  getAppConfig: () => Promise<AppConfig>;
  updateAppConfig: (config: DeepPartial<AppConfig>) => Promise<AppConfig>;
}

// 拓展全局 Window 对象，添加 electronAPI 属性
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
