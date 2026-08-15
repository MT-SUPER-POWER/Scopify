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
    audioFeature: {
      connect: (role, connectionId, onFrame, onClose) =>
        bridge.connectAudioFeatureTransport(role, connectionId, onFrame, onClose),
      publish: (frame) => bridge.publishAudioFeatureFrame(frame),
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
      getScoped: (scope, key) => bridge.getCache(scope, key),
      setScoped: async (scope, key, value, ttlMs, category) => {
        await bridge.setCache(scope, key, value, ttlMs, category);
      },
      deleteScoped: async (scope, key) => {
        await bridge.deleteCache(scope, key);
      },
      statsAll: () => bridge.getCacheStats(),
      clearSelected: (request) => bridge.clearCache(request),
      getPreferences: async () => (await bridge.getHostConfig()).cache,
      savePreferences: async (preferences) => {
        const config = await bridge.getHostConfig();
        const saved = await bridge.updateHostConfig({
          ...config,
          cache: { ...config.cache, page: preferences.page, playback: preferences.playback },
        });
        return saved.cache;
      },
    },
    config: {
      loadHostConfig: () => bridge.getHostConfig(),
      saveHostConfig: (config) => bridge.updateHostConfig(config),
      selectDirectory: (defaultPath) => bridge.selectDirectory(defaultPath),
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
      open: () => bridge.openDesktopLyric(),
      sendCommand: (command) => bridge.sendDesktopLyricCommand(command),
      toggle: () => bridge.toggleDesktopLyric(),
      updatePreferences: (update) => bridge.updateDesktopLyricPreferences(update),
    },
    desktopPlaybackWallpaper: {
      closeController: () => bridge.closeDesktopPlaybackController(),
      configure: (update) => bridge.updateDesktopPlaybackWallpaperPreferences(update),
      getModel: () => bridge.getDesktopPlaybackWallpaperModel(),
      onModelChanged: (callback) => bridge.onDesktopPlaybackWallpaperModelChanged(callback),
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
      toggleDeveloperTools: () => bridge.toggleDeveloperTools(),
    },
  };
}
