import { contextBridge, ipcRenderer } from "electron";
import type {
  DesktopBridge,
  DesktopIconVisibilityState,
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopLyricSnapshot,
  DesktopLyricSnapshotInput,
  DesktopHostConfig,
  DesktopPlaybackControllerLayout,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperAudioFrame,
  DesktopPlaybackWallpaperPresentation,
  DesktopPlaybackWallpaperPresentationInput,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopify/desktop-contract";

const electronAPI: DesktopBridge = {
  relaunchApp: () => {
    ipcRenderer.send("relaunch-app");
  },
  getBridgeInfo: () => ipcRenderer.invoke("bridge:get-info"),
  onAppCloseRequested: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("app-close-confirm", listener);
    return () => ipcRenderer.removeListener("app-close-confirm", listener);
  },
  setPlayerPlaying: (isPlaying) => {
    ipcRenderer.send("player-state-changed", { isPlaying });
  },
  enterFullScreen: () => ipcRenderer.send("window-enter-full-screen"),
  exitFullScreen: () => ipcRenderer.send("window-exit-full-screen"),
  onFullScreenChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, data: { isFullScreen: boolean }) =>
      callback(data.isFullScreen);
    ipcRenderer.on("window-full-screen-changed", listener);
    return () => ipcRenderer.removeListener("window-full-screen-changed", listener);
  },
  openLoginWindow: () => {
    ipcRenderer.send("open-login-window");
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
  getHostConfig: () => ipcRenderer.invoke("config:get-host"),
  getDesktopIconVisibility: () => ipcRenderer.invoke("desktop-icons:get-visibility"),
  updateHostConfig: (config: DesktopHostConfig) => ipcRenderer.invoke("config:update-host", config),
  writeLog: (event) => ipcRenderer.invoke("logger:write", event),
  getPageCache: (key) => ipcRenderer.invoke("cache:get", key),
  setPageCache: (key, value, ttlMs) => ipcRenderer.invoke("cache:set", key, value, ttlMs),
  deletePageCache: (key) => ipcRenderer.invoke("cache:delete", key),
  clearPageCache: () => ipcRenderer.invoke("cache:clear"),
  getPageCacheStats: () => ipcRenderer.invoke("cache:get-stats"),
  getUpdateStatus: () => ipcRenderer.invoke("updater:get-status"),
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  downloadUpdate: () => ipcRenderer.invoke("updater:download"),
  quitAndInstallUpdate: () => ipcRenderer.send("updater:quit-and-install"),
  setCookie: (cookieStr: string, backendOrigin: string) =>
    ipcRenderer.invoke("set-music-cookie", cookieStr, backendOrigin),
  setDesktopIconVisibility: (visible: boolean): Promise<DesktopIconVisibilityState> =>
    ipcRenderer.invoke("desktop-icons:set-visibility", visible),
  navigateTo: (path: string) => ipcRenderer.send("navigate-main-window", path),
  onNavigate: (callback: (path: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on("navigate-to", listener);
    return () => ipcRenderer.removeListener("navigate-to", listener);
  },
  loginSuccess: () => ipcRenderer.send("login-success"),
  onControlAudio: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, action: "next" | "prev" | "toggle-play") =>
      callback(action);
    ipcRenderer.on("control-audio", listener);
    return () => ipcRenderer.removeListener("control-audio", listener);
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
  closeDesktopLyric: () => ipcRenderer.invoke("desktop-lyric:close"),
  closeDesktopPlaybackController: () => ipcRenderer.invoke("desktop-playback-controller:close"),
  setDesktopPlaybackControllerLayout: (layout: DesktopPlaybackControllerLayout) =>
    ipcRenderer.invoke("desktop-playback-controller:set-layout", layout),
  getDesktopLyricSnapshot: () => ipcRenderer.invoke("desktop-lyric:get-snapshot"),
  publishDesktopLyricSnapshot: (snapshot: DesktopLyricSnapshotInput) =>
    ipcRenderer.invoke("desktop-lyric:publish-snapshot", snapshot),
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
  onDesktopLyricCommand: (callback: (command: DesktopLyricCommand) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: DesktopLyricCommand) => {
      callback(command);
    };
    ipcRenderer.on("desktop-lyric:command", listener);
    return () => ipcRenderer.removeListener("desktop-lyric:command", listener);
  },
  getDesktopPlaybackWallpaperModel: () =>
    ipcRenderer.invoke("desktop-playback-wallpaper:get-model"),
  getDesktopPlaybackWallpaperPresentation: () =>
    ipcRenderer.invoke("desktop-playback-wallpaper:get-presentation"),
  updateDesktopPlaybackWallpaperPreferences: (update: DesktopPlaybackWallpaperPreferencesUpdate) =>
    ipcRenderer.invoke("desktop-playback-wallpaper:configure", update),
  retryDesktopPlaybackWallpaper: () => ipcRenderer.invoke("desktop-playback-wallpaper:retry"),
  publishDesktopPlaybackWallpaperPresentation: (
    presentation: DesktopPlaybackWallpaperPresentationInput,
  ) => ipcRenderer.invoke("desktop-playback-wallpaper:publish-presentation", presentation),
  publishDesktopPlaybackWallpaperAudioFrame: (frame: DesktopPlaybackWallpaperAudioFrame) =>
    ipcRenderer.send("desktop-playback-wallpaper:audio-frame", frame),
  showDesktopPlaybackController: () => ipcRenderer.invoke("desktop-playback-controller:show"),
  onDesktopPlaybackWallpaperModelChanged: (
    callback: (model: DesktopPlaybackWallpaperModel) => void,
  ) => {
    const listener = (_event: Electron.IpcRendererEvent, model: DesktopPlaybackWallpaperModel) =>
      callback(model);
    ipcRenderer.on("desktop-playback-wallpaper:model-changed", listener);
    return () => ipcRenderer.removeListener("desktop-playback-wallpaper:model-changed", listener);
  },
  onDesktopPlaybackWallpaperPresentationChanged: (
    callback: (presentation: DesktopPlaybackWallpaperPresentation) => void,
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      presentation: DesktopPlaybackWallpaperPresentation,
    ) => callback(presentation);
    ipcRenderer.on("desktop-playback-wallpaper:presentation-changed", listener);
    return () =>
      ipcRenderer.removeListener("desktop-playback-wallpaper:presentation-changed", listener);
  },
  onDesktopPlaybackWallpaperAudioFrame: (
    callback: (frame: DesktopPlaybackWallpaperAudioFrame) => void,
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      frame: DesktopPlaybackWallpaperAudioFrame,
    ) => callback(frame);
    ipcRenderer.on("desktop-playback-wallpaper:audio-frame", listener);
    return () => ipcRenderer.removeListener("desktop-playback-wallpaper:audio-frame", listener);
  },
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
} catch (error) {
  console.error("[Preload] Error:", error);
}
