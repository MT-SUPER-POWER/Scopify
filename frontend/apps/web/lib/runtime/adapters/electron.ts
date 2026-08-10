import type { DesktopBridge } from "@scopify/desktop-contract";

import type { LyricData } from "@/types/lyrics";

import type { WebRuntime } from "../types";

export type ScopifyDesktopBridge = DesktopBridge<LyricData>;

export function createElectronRuntime(bridge: ScopifyDesktopBridge): WebRuntime {
  return {
    app: {
      exit: () => bridge.exitApp(),
      onCloseRequested: (callback) => bridge.onAppCloseRequested(callback),
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
    desktopLyrics: {
      close: () => bridge.closeDesktopLyric(),
      getPreferences: () => bridge.getDesktopLyricPreferences(),
      getSnapshot: () => bridge.getDesktopLyricSnapshot(),
      onCommand: (callback) => bridge.onDesktopLyricCommand(callback),
      onSnapshot: (callback) => bridge.onDesktopLyricSnapshot(callback),
      publish: (snapshot) => bridge.publishDesktopLyricSnapshot(snapshot),
      sendCommand: (command) => bridge.sendDesktopLyricCommand(command),
      updatePreferences: (update) => bridge.updateDesktopLyricPreferences(update),
    },
    desktopPlaybackWallpaper: {
      closeController: () => bridge.closeDesktopPlaybackController(),
      configure: (update) => bridge.updateDesktopPlaybackWallpaperPreferences(update),
      getModel: () => bridge.getDesktopPlaybackWallpaperModel(),
      getPresentation: () => bridge.getDesktopPlaybackWallpaperPresentation(),
      onAudioFrame: (callback) => bridge.onDesktopPlaybackWallpaperAudioFrame(callback),
      onModelChanged: (callback) => bridge.onDesktopPlaybackWallpaperModelChanged(callback),
      onPresentationChanged: (callback) =>
        bridge.onDesktopPlaybackWallpaperPresentationChanged(callback),
      publishAudioFrame: (frame) => bridge.publishDesktopPlaybackWallpaperAudioFrame(frame),
      publishPresentation: (presentation) =>
        bridge.publishDesktopPlaybackWallpaperPresentation(presentation),
      retry: () => bridge.retryDesktopPlaybackWallpaper(),
      setControllerLayout: (layout) => bridge.setDesktopPlaybackControllerLayout(layout),
      showController: () => bridge.showDesktopPlaybackController(),
    },
    isDesktop: true,
    kind: "desktop",
    logging: { write: (event) => bridge.writeLog(event) },
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
