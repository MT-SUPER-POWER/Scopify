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
  DesktopPlaybackWallpaperPreferencesUpdate,
  AudioFeatureAck,
  AudioFeatureFrameV1,
  AudioFeatureTransportRole,
  PlaybackTransportPayload,
  PlaybackTransportRole,
} from "@mt-super-power/desktop-contract";

type ElectronRendererMessagePort = MessagePort & {
  onclose: ((event: Event) => void) | null;
};

let playbackTransportPort: ElectronRendererMessagePort | null = null;
let audioFeatureTransportPort: ElectronRendererMessagePort | null = null;

function closePlaybackTransportPort() {
  const port = playbackTransportPort;
  playbackTransportPort = null;
  if (!port) return;
  port.onmessage = null;
  port.onmessageerror = null;
  port.onclose = null;
  port.close();
}

function closeAudioFeatureTransportPort() {
  const port = audioFeatureTransportPort;
  audioFeatureTransportPort = null;
  if (!port) return;
  port.onmessage = null;
  port.onmessageerror = null;
  port.onclose = null;
  port.close();
}

const electronAPI: DesktopBridge = {
  connectAudioFeatureTransport: (
    role: AudioFeatureTransportRole,
    connectionId: string,
    onFrame: (frame: AudioFeatureFrameV1) => void,
    onClose: () => void,
  ) => {
    closeAudioFeatureTransportPort();
    const channel = new MessageChannel();
    const port = channel.port1 as ElectronRendererMessagePort;
    audioFeatureTransportPort = port;
    port.onmessage = (event) => {
      if (role !== "subscriber") return;
      const frame = event.data as AudioFeatureFrameV1;
      try {
        onFrame(frame);
      } finally {
        try {
          port.postMessage({
            sequence: frame.sequence,
            streamId: frame.streamId,
            type: "audio-feature-ack",
          } satisfies AudioFeatureAck);
        } catch {
          // The main process owns transport failure handling; do not fall back to IPC.
        }
      }
    };
    port.onmessageerror = () => {
      if (audioFeatureTransportPort !== port) return;
      closeAudioFeatureTransportPort();
      onClose();
    };
    port.onclose = () => {
      if (audioFeatureTransportPort !== port) return;
      audioFeatureTransportPort = null;
      onClose();
    };
    port.start();
    ipcRenderer.postMessage("audio-feature-transport:connect", { connectionId, role }, [
      channel.port2,
    ]);

    return () => {
      if (audioFeatureTransportPort === port) closeAudioFeatureTransportPort();
    };
  },
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
  getDiscordPresenceStatus: () => ipcRenderer.invoke("discord-presence:get-status"),
  testDiscordPresenceConnection: () => ipcRenderer.invoke("discord-presence:test-connection"),
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
  publishAudioFeatureFrame: (frame: AudioFeatureFrameV1) => {
    const port = audioFeatureTransportPort;
    if (!port) return false;
    try {
      port.postMessage(frame);
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
  selectDirectory: (defaultPath?: string) =>
    ipcRenderer.invoke("dialog:select-directory", defaultPath),
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
  getCache: (scope, key) => ipcRenderer.invoke("cache:get-scoped", scope, key),
  setCache: (scope, key, value, ttlMs, category) =>
    ipcRenderer.invoke("cache:set-scoped", scope, key, value, ttlMs, category),
  deleteCache: (scope, key) => ipcRenderer.invoke("cache:delete-scoped", scope, key),
  getCacheStats: () => ipcRenderer.invoke("cache:get-all-stats"),
  clearCache: (request) => ipcRenderer.invoke("cache:clear-selected", request),
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
  openDesktopLyric: () => ipcRenderer.invoke("desktop-lyric:open"),
  toggleDesktopLyric: () => ipcRenderer.invoke("desktop-lyric:toggle"),
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
  onDiscordPresenceStatusChanged: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      status: Parameters<typeof callback>[0],
    ) => {
      callback(status);
    };
    ipcRenderer.on("discord-presence:status-changed", listener);
    return () => ipcRenderer.removeListener("discord-presence:status-changed", listener);
  },
  publishDiscordPresenceSnapshot: (snapshot) =>
    ipcRenderer.invoke("discord-presence:publish", snapshot),
  getDesktopPlaybackWallpaperModel: () =>
    ipcRenderer.invoke("desktop-playback-wallpaper:get-model"),
  updateDesktopPlaybackWallpaperPreferences: (update: DesktopPlaybackWallpaperPreferencesUpdate) =>
    ipcRenderer.invoke("desktop-playback-wallpaper:configure", update),
  retryDesktopPlaybackWallpaper: () => ipcRenderer.invoke("desktop-playback-wallpaper:retry"),
  showDesktopPlaybackController: () => ipcRenderer.invoke("desktop-playback-controller:show"),
  onDesktopPlaybackWallpaperModelChanged: (
    callback: (model: DesktopPlaybackWallpaperModel) => void,
  ) => {
    const listener = (_event: Electron.IpcRendererEvent, model: DesktopPlaybackWallpaperModel) =>
      callback(model);
    ipcRenderer.on("desktop-playback-wallpaper:model-changed", listener);
    return () => ipcRenderer.removeListener("desktop-playback-wallpaper:model-changed", listener);
  },
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
} catch (error) {
  console.error("[Preload] Error:", error);
}
