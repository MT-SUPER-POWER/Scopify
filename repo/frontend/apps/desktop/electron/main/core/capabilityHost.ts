import type { BrowserWindow } from "electron";

import type { WindowCapabilityHostOptions } from "@/types/electronCapabilityHost";
import { initializeAudioFeatureBrokerIpc } from "@main/capabilities/audioFeatureBroker/ipc";
import { initializeDesktopIconVisibilityCapability } from "@main/capabilities/desktopIcons";
import {
  initializeDesktopPlaybackWallpaperCapability,
  waitForDesktopPlaybackWallpaperInitialization,
} from "@main/capabilities/desktopPlaybackWallpaper";
import type { DesktopPlaybackWallpaperCapability } from "@main/capabilities/desktopPlaybackWallpaper/capability";
import {
  createDesktopPlaybackControllerWindow,
  type DesktopPlaybackControllerWindow,
} from "@main/capabilities/desktopPlaybackWallpaper/controllerWindow";
import {
  createElectronDesktopPlaybackWallpaperDriver,
  type ElectronDesktopPlaybackWallpaperDriver,
} from "@main/capabilities/desktopPlaybackWallpaper/electronDriver";
import { initializePlaybackBrokerIpc } from "@main/capabilities/playbackBroker/ipc";
import { desktopConfig, logger } from "@main/constants";
import { registerIpcHandlers } from "@main/ipc";
import { initializeUpdater } from "@main/services/updater";
import { getDesktopLyricWindow, initializeDesktopLyricCompanion } from "@main/window/desktopLyric";
import { initializeLoginWindow } from "@main/window/login";
import { initTray, trayWindow } from "@main/window/tray";

/** Owns every capability whose lifetime is attached to the main BrowserWindow. */
export function createWindowCapabilityHost(options: WindowCapabilityHostOptions) {
  let wallpaperDriver: ElectronDesktopPlaybackWallpaperDriver | null = null;
  let wallpaperCapability: DesktopPlaybackWallpaperCapability | null = null;
  let controllerWindow: DesktopPlaybackControllerWindow | null = null;
  let playbackBroker: ReturnType<typeof initializePlaybackBrokerIpc> | null = null;
  let audioFeatureBroker: ReturnType<typeof initializeAudioFeatureBrokerIpc> | null = null;

  function attach(window: BrowserWindow) {
    wallpaperDriver ??= createElectronDesktopPlaybackWallpaperDriver({
      mainWindow: window,
      onHostLost: (diagnostic) => {
        logger.error("[desktop-playback-wallpaper] native host lost", { diagnostic });
        void wallpaperCapability
          ?.configure({ enabled: false })
          .catch((error) => logger.error("[desktop-playback-wallpaper] recovery failed", error));
      },
    });
    controllerWindow ??= createDesktopPlaybackControllerWindow({
      rendererBaseUrl: options.rendererBaseUrl,
    });

    registerIpcHandlers(window, options.discordPresence, options.backendController);
    initializeDesktopIconVisibilityCapability(window, {
      getControllerWindow: controllerWindow.getWindow,
    });
    initializeDesktopLyricCompanion(window, { rendererBaseUrl: options.rendererBaseUrl });
    wallpaperCapability = initializeDesktopPlaybackWallpaperCapability(window, {
      controller: controllerWindow,
      driver: wallpaperDriver,
      getControllerWindow: controllerWindow.getWindow,
    });
    playbackBroker ??= initializePlaybackBrokerIpc({
      getAuthorityWindow: options.getMainWindow,
      getReplicaWindows: () => [
        options.getMainWindow(),
        getDesktopLyricWindow(),
        controllerWindow?.getWindow() ?? null,
        trayWindow,
      ],
      onAuthorityConnected: (senderId) => {
        logger.info("[playback] main renderer authority connected", { senderId });
      },
      onRejected: (message) => logger.warn(`[playback-broker] ${message}`),
    });
    audioFeatureBroker ??= initializeAudioFeatureBrokerIpc({
      getPublisherWindow: options.getMainWindow,
      getSubscriberWindows: () => [controllerWindow?.getWindow() ?? null],
      onRejected: (message) => logger.warn(`[audio-feature-broker] ${message}`),
    });
    initializeUpdater(window, desktopConfig.updater);

    if (process.platform !== "darwin") {
      initTray(window, {
        onMainWindowRequested: async () => {
          if (wallpaperDriver?.isWallpaperActive()) {
            await wallpaperCapability?.configure({ enabled: false });
            return;
          }
          if (window.isMinimized()) window.restore();
          window.show();
          window.focus();
        },
      });
    }
    initializeLoginWindow(window);
  }

  return {
    attach,
    dispose() {
      playbackBroker?.dispose();
      playbackBroker = null;
      audioFeatureBroker?.dispose();
      audioFeatureBroker = null;
      controllerWindow?.dispose();
      controllerWindow = null;
      wallpaperCapability = null;
    },
    isWallpaperActive: () => wallpaperDriver?.isWallpaperActive() ?? false,
    waitUntilReady: waitForDesktopPlaybackWallpaperInitialization,
  };
}
