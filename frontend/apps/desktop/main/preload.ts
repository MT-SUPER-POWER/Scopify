import { contextBridge, ipcRenderer } from "electron";
import type {
  DesktopBridge,
  DesktopIconVisibilityState,
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopHostConfig,
  DesktopPlaybackControllerLayout,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperAudioFrame,
  DesktopPlaybackWallpaperPreferencesUpdate,
  PlaybackTransportPayload,
  PlaybackTransportRole,
} from "@scopify/desktop-contract";

type ElectronRendererMessagePort = MessagePort & {
  onclose: ((event: Event) => void) | null;
};

let playbackTransportPort: ElectronRendererMessagePort | null = null;

function closePlaybackTransportPort() {
  const port = playbackTransportPort;
  playbackTransportPort = null;
  if (!port) return;
  port.onmessage = null;
  port.onmessageerror = null;
  port.onclose = null;
  port.close();
}

const electronAPI: DesktopBridge = {
  connectPlaybackTransport: (
    role: PlaybackTransportRole,
    connectionId: string,
    onPayload: (payload: PlaybackTransportPayload) => void,
    onClose: () => void,
  ) => {
    closePlaybackTransportPort();
    const channel = new MessageChannel();
    const port = channel.port1 as ElectronRendererMessagePort;
    playbackTransportPort = port;
    port.onmessage = (event) => onPayload(event.data as PlaybackTransportPayload);
    port.onmessageerror = () => {
      if (playbackTransportPort !== port) return;
      closePlaybackTransportPort();
      onClose();
    };
    port.onclose = () => {
      if (playbackTransportPort !== port) return;
      playbackTransportPort = null;
      onClose();
    };
    port.start();
    ipcRenderer.postMessage("playback-transport:connect", { connectionId, role }, [channel.port2]);

    return () => {
      if (playbackTransportPort === port) closePlaybackTransportPort();
    };
  },
  relaunchApp: () => {
    ipcRenderer.send("relaunch-app");
  },
  getBridgeInfo: () => ipcRenderer.invoke("bridge:get-info"),
  setPlayerPlaying: (isPlaying) => {
    ipcRenderer.send("player-state-changed", { isPlaying });
  },
  sendPlaybackTransportPayload: (payload: PlaybackTransportPayload) => {
    const port = playbackTransportPort;
    if (!port) return false;
    try {
      port.postMessage(payload);
      return true;
    } catch {
      return false;
    }
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
  sendAppCloseAction: (action: "minimize" | "exit" | "cancel") => {
    ipcRenderer.send("app-close-action", action);
  },
  getHostConfig: () => ipcRenderer.invoke("config:get-host"),
  getLogDirectory: () => ipcRenderer.invoke("logger:get-directory"),
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
  getDesktopLyricPreferences: () => ipcRenderer.invoke("desktop-lyric:get-preferences"),
  updateDesktopLyricPreferences: (update: DesktopLyricPreferencesUpdate) =>
    ipcRenderer.invoke("desktop-lyric:update-preferences", update),
  sendDesktopLyricCommand: (command: DesktopLyricCommand) =>
    ipcRenderer.send("desktop-lyric:command", command),
  onDesktopLyricCommand: (callback: (command: DesktopLyricCommand) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: DesktopLyricCommand) => {
      callback(command);
    };
    ipcRenderer.on("desktop-lyric:command", listener);
    return () => ipcRenderer.removeListener("desktop-lyric:command", listener);
  },
  getDesktopPlaybackWallpaperModel: () =>
    ipcRenderer.invoke("desktop-playback-wallpaper:get-model"),
  updateDesktopPlaybackWallpaperPreferences: (update: DesktopPlaybackWallpaperPreferencesUpdate) =>
    ipcRenderer.invoke("desktop-playback-wallpaper:configure", update),
  retryDesktopPlaybackWallpaper: () => ipcRenderer.invoke("desktop-playback-wallpaper:retry"),
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
