import { contextBridge, ipcRenderer } from "electron";
import { ElectronAPI } from "@/types/electron";

// NOTE: 写好了接口，记得在 types/electron.d.ts 中声明类型
const electronAPI: ElectronAPI = {
  relaunchApp: () => { ipcRenderer.send("relaunch-app"); },
  on: (channel, callback) => { ipcRenderer.on(channel, callback); },
  off: (channel) => { ipcRenderer.removeAllListeners(channel); },
  send: (channel, args) => { ipcRenderer.send(channel, args); },
  enterFullScreen: () => ipcRenderer.send("window-enter-full-screen"),
  exitFullScreen: () => ipcRenderer.send("window-exit-full-screen"),
  onFullScreenChanged: (callback) => {
    ipcRenderer.on("window-full-screen-changed", (event, data) => { callback(data.isFullScreen); });
  },
  openLoginWindow: () => { ipcRenderer.send("open-login-window"); },
  closeLoginWindow: () => { ipcRenderer.send("close-login-window"); },
  mainWindowReload: () => { ipcRenderer.send("main-window-reload"); },
  exitApp: () => { ipcRenderer.send("exit-app"); },
  minimizeApp: () => { ipcRenderer.send("minimize-to-tray"); },
  sendAppCloseAction: (action: "minimize" | "exit") => { ipcRenderer.send("app-close-action", action); },
  getAppConfig: () => ipcRenderer.invoke("get-app-config"),
  updateAppConfig: (config) => ipcRenderer.invoke("update-app-config", config),
  setCookie: (cookieStr: string) => ipcRenderer.invoke("set-music-cookie", cookieStr),
  navigateTo: (path: string) => ipcRenderer.send("navigate-main-window", path),
  // window.addEventListener("message", callback)
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on("navigate-to", (_event, path) => callback(path));
  },
  loginSuccess: () => ipcRenderer.send("login-success"),
  onControlAudio: (callback) => {
    ipcRenderer.on('control-audio', (_event, action) => { callback(action); });
  },
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
} catch (error) {
  console.error("[Preload] Error:", error);
}
