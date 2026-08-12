import type { DesktopBridge } from "@scopify/desktop-contract";

import type { LyricData } from "@/types/lyrics";

import type { WebRuntime } from "../types";

export type ScopifyDesktopBridge = DesktopBridge<LyricData>;

export function createElectronRuntime(bridge: ScopifyDesktopBridge): WebRuntime {
  return {
    app: {
      exit: () => bridge.exitApp(),
      relaunch: () => bridge.relaunchApp(),
      submitCloseAction: (action) => bridge.sendAppCloseAction(action),
    },
    auth: {
      completeLogin: () => {
        bridge.loginSuccess();
        return true;
      },
      openLoginWindow: () => {
        bridge.openLoginWindow();
        return true;
      },
      persistMusicCookie: (cookie, backendOrigin) => bridge.setCookie(cookie, backendOrigin),
    },
    cache: {
      clear: () => bridge.clearPageCache(),
      delete: async (key) => {
        await bridge.deletePageCache(key);
      },
      get: <T>(key: string) => bridge.getPageCache<T>(key),
      set: async (key, value, ttlMs) => {
        await bridge.setPageCache(key, value, ttlMs);
      },
      stats: () => bridge.getPageCacheStats(),
    },
    config: {
      loadHostConfig: () => bridge.getHostConfig(),
      saveHostConfig: (config) => bridge.updateHostConfig(config),
    },
    desktopIcons: {
      getVisibility: () => bridge.getDesktopIconVisibility(),
      setVisibility: (visible) => bridge.setDesktopIconVisibility(visible),
    },
    discord: {
      getStatus: () => bridge.getDiscordPresenceStatus(),
      onStatusChanged: (callback) => bridge.onDiscordPresenceStatusChanged(callback),
      publish: (snapshot) => bridge.publishDiscordPresenceSnapshot(snapshot),
      testConnection: () => bridge.testDiscordPresenceConnection(),
    },
    desktopLyrics: {
      close: () => bridge.closeDesktopLyric(),
      getPreferences: () => bridge.getDesktopLyricPreferences(),
      onCommand: (callback) => bridge.onDesktopLyricCommand(callback),
      sendCommand: (command) => bridge.sendDesktopLyricCommand(command),
      updatePreferences: (update) => bridge.updateDesktopLyricPreferences(update),
    },
    desktopPlaybackWallpaper: {
      closeController: () => bridge.closeDesktopPlaybackController(),
      configure: (update) => bridge.updateDesktopPlaybackWallpaperPreferences(update),
      getModel: () => bridge.getDesktopPlaybackWallpaperModel(),
      onAudioFrame: (callback) => bridge.onDesktopPlaybackWallpaperAudioFrame(callback),
      onModelChanged: (callback) => bridge.onDesktopPlaybackWallpaperModelChanged(callback),
      publishAudioFrame: (frame) => bridge.publishDesktopPlaybackWallpaperAudioFrame(frame),
      retry: () => bridge.retryDesktopPlaybackWallpaper(),
      setControllerLayout: (layout) => bridge.setDesktopPlaybackControllerLayout(layout),
      showController: () => bridge.showDesktopPlaybackController(),
    },
    isDesktop: true,
    kind: "desktop",
    logging: {
      getDirectory: () => bridge.getLogDirectory(),
      write: (event) => bridge.writeLog(event),
    },
    media: {
      onCommand: (callback) => bridge.onControlAudio(callback),
      setPlaying: (isPlaying) => bridge.setPlayerPlaying(isPlaying),
    },
    navigation: {
      navigateMainWindow: (path) => {
        bridge.navigateTo(path);
        return true;
      },
      onNavigate: (callback) => bridge.onNavigate(callback),
    },
    playback: {
      connect: (role, connectionId, onPayload, onClose) =>
        bridge.connectPlaybackTransport(role, connectionId, onPayload, onClose),
      send: (payload) => bridge.sendPlaybackTransportPayload(payload),
    },
    updates: {
      check: () => bridge.checkForUpdates(),
      download: () => bridge.downloadUpdate(),
      getStatus: () => bridge.getUpdateStatus(),
      install: () => bridge.quitAndInstallUpdate(),
      onStatusChanged: (callback) => bridge.onUpdateStatusChanged(callback),
    },
    window: {
      minimize: () => bridge.minimizeApp(),
      onFullscreenChanged: (callback) => bridge.onFullScreenChanged(callback),
      setFullscreen: async (fullscreen) => {
        if (fullscreen) bridge.enterFullScreen();
        else bridge.exitFullScreen();
      },
    },
  };
}
