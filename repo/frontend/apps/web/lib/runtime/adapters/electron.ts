import type { DesktopBridge, DesktopHostConfig } from "@scopify/desktop-contract";

import type { LyricData } from "@/types/lyrics";

import type { WebRuntime } from "../types";

export type ScopifyDesktopBridge = DesktopBridge<LyricData>;

export function createElectronRuntime(bridge: ScopifyDesktopBridge): WebRuntime {
  let cachedHostConfig: DesktopHostConfig | null = null;

  return {
    app: {
      exit: () => bridge.exitApp(),
      relaunch: () => bridge.relaunchApp(),
      submitCloseAction: (action, remember) => bridge.sendAppCloseAction(action, remember),
    },
    audioFeature: {
      connect: (role, connectionId, onFrame, onClose) =>
        bridge.connectAudioFeatureTransport(role, connectionId, onFrame, onClose),
      publish: (frame) => bridge.publishAudioFeatureFrame(frame),
    },
    auth: {
      clearMusicSession: (backendOrigin) => bridge.setCookie("", backendOrigin),
      completeLogin: () => {
        bridge.loginSuccess();
        return true;
      },
      openLoginWindow: () => {
        bridge.openLoginWindow();
        return true;
      },
      importMusicSession: (cookie, backendOrigin) => bridge.setCookie(cookie, backendOrigin),
    },
    backend: {
      getStatus: () => bridge.getBackendStatus(),
      onStatusChanged: (callback) => bridge.onBackendStatusChanged(callback),
      restart: () => bridge.restartBackend(),
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
      getPreferences: async () => {
        if (!cachedHostConfig) {
          cachedHostConfig = await bridge.getHostConfig();
        }
        return cachedHostConfig.cache;
      },
      savePreferences: async (preferences) => {
        const config = cachedHostConfig ?? (await bridge.getHostConfig());
        const saved = await bridge.updateHostConfig({
          ...config,
          cache: { ...config.cache, page: preferences.page, playback: preferences.playback },
        });
        cachedHostConfig = saved;
        return saved.cache;
      },
    },
    config: {
      loadHostConfig: async () => {
        const config = await bridge.getHostConfig();
        cachedHostConfig = config;
        return config;
      },
      saveHostConfig: async (config) => {
        const saved = await bridge.updateHostConfig(config);
        cachedHostConfig = saved;
        return saved;
      },
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
      isControllerOpen: () => bridge.isDesktopPlaybackControllerOpen(),
      onModelChanged: (callback) => bridge.onDesktopPlaybackWallpaperModelChanged(callback),
      retry: () => bridge.retryDesktopPlaybackWallpaper(),
      setControllerLayout: (layout) => bridge.setDesktopPlaybackControllerLayout(layout),
      showController: () => bridge.showDesktopPlaybackController(),
      toggleController: () => bridge.toggleDesktopPlaybackController(),
    },
    isDesktop: true,
    kind: "desktop",
    logging: {
      getDirectory: () => bridge.getLogDirectory(),
      openCurrentFile: () => bridge.openCurrentLog(),
      openDirectory: () => bridge.openLogDirectory(),
      write: (event) => bridge.writeLog(event),
    },
    mcp: {
      getClientConfiguration: () => bridge.getMcpClientConfiguration(),
      getStatus: () => bridge.getMcpStatus(),
      restart: () => bridge.restartMcp(),
      rotateCredential: () => bridge.rotateMcpCredential(),
      testConnection: () => bridge.testMcpConnection(),
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
    videoExport: {
      getCaptureSource: () => bridge.getVideoExportCaptureSource(),
      prepareWindow: (size) => bridge.prepareVideoExportWindow(size),
      restoreWindow: () => bridge.restoreVideoExportWindow(),
      selectFile: (request) => bridge.selectVideoExportFile(request),
      writeFile: (filePath, data) => bridge.writeVideoExportFile(filePath, data),
    },
    window: {
      minimize: () => bridge.minimizeApp(),
      onFullscreenChanged: (callback) => bridge.onFullScreenChanged(callback),
      onVisibilityChanged: (callback) => bridge.onWindowVisibilityChanged(callback),
      setFullscreen: async (fullscreen) => {
        if (fullscreen) bridge.enterFullScreen();
        else bridge.exitFullScreen();
      },
      toggleDeveloperTools: () => bridge.toggleDeveloperTools(),
    },
  };
}
