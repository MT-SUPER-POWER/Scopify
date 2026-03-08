import { contextBridge, ipcRenderer } from "electron";

interface ElectronAPI {
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  send: (channel: string, args?: unknown) => void;
  enterFullScreen: () => void;
  exitFullScreen: () => void;
  onFullScreenChanged: (callback: (isFullScreen: boolean) => void) => void;
  openLoginWindow: () => void;
  closeLoginWindow: () => void;
  maniWindowReload: () => void;
}

// 写好了接口，记得在 types/electron.d.ts 中声明类型
// 不然 ts 文件不知道函数类型会报错
const electronAPI: ElectronAPI = {
  on: (channel, callback) => { ipcRenderer.on(channel, callback); },
  send: (channel, args) => { ipcRenderer.send(channel, args); },
  enterFullScreen: () => ipcRenderer.send("window-enter-full-screen"),
  exitFullScreen: () => ipcRenderer.send("window-exit-full-screen"),
  onFullScreenChanged: (callback) => {
    ipcRenderer.on("window-full-screen-changed", (event, data) => { callback(data.isFullScreen); });
  },
  openLoginWindow: () => { ipcRenderer.send("open-login-window"); },
  closeLoginWindow: () => { ipcRenderer.send("close-login-window"); },
  maniWindowReload: () => { ipcRenderer.send("main-window-reload"); }
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
} catch (error) {
  console.error("[Preload] Error:", error);
}

export { electronAPI };
