import { contextBridge, ipcRenderer } from "electron";
import type { BackendStartupStatus } from "@/types/backend";
import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopLyricSnapshot,
  DesktopLyricSnapshotInput,
  DesktopLyricSnapshotUpdate,
} from "@/types/desktopLyric";
import type { ElectronAPI } from "@/types/electron";

// NOTE: 写好了接口，记得在 types/electron.d.ts 中声明类型
const electronAPI: ElectronAPI = {
  relaunchApp: () => {
    ipcRenderer.send("relaunch-app");
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, callback);
  },
  off: (channel, callback) => {
    if (callback) {
      ipcRenderer.removeListener(channel, callback);
      return;
    }
    ipcRenderer.removeAllListeners(channel);
  },
  send: (channel, args) => {
    ipcRenderer.send(channel, args);
  },
  enterFullScreen: () => ipcRenderer.send("window-enter-full-screen"),
  exitFullScreen: () => ipcRenderer.send("window-exit-full-screen"),
  onFullScreenChanged: (callback) => {
    ipcRenderer.on("window-full-screen-changed", (_event, data) => {
      callback(data.isFullScreen);
    });
  },
  openLoginWindow: () => {
    ipcRenderer.send("open-login-window");
  },
  closeLoginWindow: () => {
    ipcRenderer.send("close-login-window");
  },
  mainWindowReload: () => {
    ipcRenderer.send("main-window-reload");
  },
  exitApp: () => {
    ipcRenderer.send("exit-app");
  },
  minimizeApp: () => {
    ipcRenderer.send("minimize-to-tray");
  },
  sendAppCloseAction: (action: "minimize" | "exit") => {
    ipcRenderer.send("app-close-action", action);
  },
  getAppConfig: () => ipcRenderer.invoke("get-app-config"),
  updateAppConfig: (config) => ipcRenderer.invoke("update-app-config", config),
  writeLog: (event) => ipcRenderer.invoke("logger:write", event),
  getPageCache: (key) => ipcRenderer.invoke("cache:get", key),
  setPageCache: (key, value, ttlMs) => ipcRenderer.invoke("cache:set", key, value, ttlMs),
  deletePageCache: (key) => ipcRenderer.invoke("cache:delete", key),
  clearPageCache: () => ipcRenderer.invoke("cache:clear"),
  getPageCacheStats: () => ipcRenderer.invoke("cache:get-stats"),
  getBackendStatus: () => ipcRenderer.invoke("backend:get-status"),
  getUpdateStatus: () => ipcRenderer.invoke("updater:get-status"),
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  downloadUpdate: () => ipcRenderer.invoke("updater:download"),
  quitAndInstallUpdate: () => ipcRenderer.send("updater:quit-and-install"),
  setCookie: (cookieStr: string) => ipcRenderer.invoke("set-music-cookie", cookieStr),
  navigateTo: (path: string) => ipcRenderer.send("navigate-main-window", path),
  // window.addEventListener("message", callback)
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on("navigate-to", (_event, path) => callback(path));
  },
  loginSuccess: () => ipcRenderer.send("login-success"),
  onControlAudio: (callback) => {
    ipcRenderer.on("control-audio", (_event, action) => {
      callback(action);
    });
  },
  onBackendStatusChanged: (callback) => {
    ipcRenderer.on("backend-status-changed", (_event, status: BackendStartupStatus) => {
      callback(status);
    });
  },
  onUpdateStatusChanged: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      status: Parameters<typeof callback>[0],
    ) => {
      callback(status);
    };
    ipcRenderer.on("updater:status-changed", listener);
    return () => ipcRenderer.removeListener("updater:status-changed", listener);
  },
  openDesktopLyric: () => ipcRenderer.invoke("desktop-lyric:open"),
  toggleDesktopLyric: () => ipcRenderer.invoke("desktop-lyric:toggle"),
  closeDesktopLyric: () => ipcRenderer.invoke("desktop-lyric:close"),
  getDesktopLyricSnapshot: () => ipcRenderer.invoke("desktop-lyric:get-snapshot"),
  publishDesktopLyricSnapshot: (snapshot: DesktopLyricSnapshotInput) =>
    ipcRenderer.invoke("desktop-lyric:publish-snapshot", snapshot),
  updateDesktopLyricSnapshot: (update: DesktopLyricSnapshotUpdate) =>
    ipcRenderer.invoke("desktop-lyric:update-snapshot", update),
  getDesktopLyricPreferences: () => ipcRenderer.invoke("desktop-lyric:get-preferences"),
  updateDesktopLyricPreferences: (update: DesktopLyricPreferencesUpdate) =>
    ipcRenderer.invoke("desktop-lyric:update-preferences", update),
  sendDesktopLyricCommand: (command: DesktopLyricCommand) =>
    ipcRenderer.send("desktop-lyric:command", command),
  onDesktopLyricSnapshot: (callback: (snapshot: DesktopLyricSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: DesktopLyricSnapshot) => {
      callback(snapshot);
    };
    ipcRenderer.on("desktop-lyric:snapshot", listener);
    return () => ipcRenderer.removeListener("desktop-lyric:snapshot", listener);
  },
  onDesktopLyricPreferences: (callback: (preferences: DesktopLyricPreferences) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, preferences: DesktopLyricPreferences) => {
      callback(preferences);
    };
    ipcRenderer.on("desktop-lyric:preferences", listener);
    return () => ipcRenderer.removeListener("desktop-lyric:preferences", listener);
  },
  onDesktopLyricCommand: (callback: (command: DesktopLyricCommand) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: DesktopLyricCommand) => {
      callback(command);
    };
    ipcRenderer.on("desktop-lyric:command", listener);
    return () => ipcRenderer.removeListener("desktop-lyric:command", listener);
  },
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
} catch (error) {
  console.error("[Preload] Error:", error);
}
