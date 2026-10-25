import { app, type BrowserWindow } from "electron";

import type { WindowServiceHostOptions } from "@/types/electronServiceHost";
import { initializeAudioFeatureBrokerIpc } from "@main/service/audio/featureBroker/ipc";
import {
  createElectronMcpCredentialStore,
  createMcpRuntime,
  type McpRuntime,
} from "@main/service/mcp";
import { initializeDesktopIconVisibilityService } from "@main/service/desktop/icons";
import {
  initializeDesktopPlaybackWallpaperService,
  waitForDesktopPlaybackWallpaperInitialization,
} from "@main/service/desktop/wallpaper";
import type { DesktopPlaybackWallpaperService } from "@/types/service/desktop/wallpaper/service";
import { createDesktopPlaybackControllerWindow } from "@main/service/desktop/wallpaper/controllerWindow";
import type { DesktopPlaybackControllerWindow } from "@/types/service/desktop/wallpaper/controllerWindow";
import {
  createElectronDesktopPlaybackWallpaperDriver,
  type ElectronDesktopPlaybackWallpaperDriver,
} from "@main/service/desktop/wallpaper/electronDriver";
import { createPlaybackBroker } from "@main/service/playback/broker";
import type { PlaybackBroker } from "@/types/service/playback/broker";
import { bindPlaybackBrokerIpc } from "@main/service/playback/broker/ipc";
import type { PlaybackBrokerIpcBinding } from "@/types/service/playback/broker/ipc";
import { createPlaybackGateway } from "@main/service/playback/gateway";
import type { PlaybackGateway } from "@/types/service/playback/gateway";
import { initializeTaskbarProgressService } from "@main/service/playback/taskbarProgress";
import type { TaskbarProgressService } from "@/types/service/playback/taskbarProgress";
import { desktopConfig } from "@main/constants";
import { brokerLog, wallpaperLog } from "@main/utils/logger";
import { registerIpcHandlers } from "@main/ipc";
import { initializeUpdater } from "@main/service/updates";
import { getDesktopLyricWindow, initializeDesktopLyricCompanion } from "@main/window/desktopLyric";
import {
  getDynamicIslandWindow,
  initializeDynamicIslandCompanion,
} from "@main/window/dynamicIsland";
import { getTaskbarLyricWindow, initializeTaskbarLyricCompanion } from "@main/window/taskbarLyric";
import { initializeLoginWindow } from "@main/window/login";
import { keepMainWindowRendering } from "@main/window/mainWindow";
import { getTrayWindow, initTray, trayWindow } from "@main/window/tray";
import { initMacTray } from "@main/window/macTray";

/** Owns every capability whose lifetime is attached to the main BrowserWindow. */
export function createWindowServiceHost(options: WindowServiceHostOptions) {
  let wallpaperDriver: ElectronDesktopPlaybackWallpaperDriver | null = null;
  let wallpaperService: DesktopPlaybackWallpaperService | null = null;
  let controllerWindow: DesktopPlaybackControllerWindow | null = null;
  let playbackBroker: PlaybackBroker | null = null;
  let playbackBrokerIpc: PlaybackBrokerIpcBinding | null = null;
  let playbackGateway: PlaybackGateway | null = null;
  let taskbarProgress: TaskbarProgressService | null = null;
  let mcpRuntime: McpRuntime | null = null;
  let audioFeatureBroker: ReturnType<typeof initializeAudioFeatureBrokerIpc> | null = null;
  let stopWallpaperRenderingSync: (() => void) | null = null;

  function attach(window: BrowserWindow) {
    wallpaperDriver ??= createElectronDesktopPlaybackWallpaperDriver({
      mainWindow: window,
      onHostLost: (diagnostic) => {
        wallpaperLog.error("[desktop-playback-wallpaper] native host lost", { diagnostic });
        void wallpaperService
          ?.configure({ enabled: false })
          .catch((error) =>
            wallpaperLog.error("[desktop-playback-wallpaper] recovery failed", error),
          );
      },
    });
    controllerWindow ??= createDesktopPlaybackControllerWindow({
      rendererBaseUrl: options.rendererBaseUrl,
    });

    playbackBroker ??= createPlaybackBroker();
    playbackGateway ??= createPlaybackGateway(playbackBroker);
    mcpRuntime ??= createMcpRuntime({
      credentials: createElectronMcpCredentialStore(),
      playback: playbackGateway,
      version: app.getVersion(),
    });

    taskbarProgress?.dispose();
    taskbarProgress = initializeTaskbarProgressService({
      getPlaybackAnchor: () => playbackBroker?.getBootstrap()?.anchor ?? null,
      playback: playbackGateway,
      window,
    });

    registerIpcHandlers(window, options.discordPresence, options.backendController, mcpRuntime);
    initializeDesktopIconVisibilityService(window, {
      getControllerWindow: controllerWindow.getWindow,
    });
    initializeDesktopLyricCompanion(window, { rendererBaseUrl: options.rendererBaseUrl });
    initializeDynamicIslandCompanion(window, { rendererBaseUrl: options.rendererBaseUrl });
    initializeTaskbarLyricCompanion(window, { rendererBaseUrl: options.rendererBaseUrl });
    wallpaperService = initializeDesktopPlaybackWallpaperService(window, {
      controller: controllerWindow,
      driver: wallpaperDriver,
      getControllerWindow: controllerWindow.getWindow,
    });
    // The wallpaper driver hides the main window and waits on its rAF before attaching it,
    // so an enabled wallpaper must keep the hidden window drawing frames.
    stopWallpaperRenderingSync?.();
    stopWallpaperRenderingSync = wallpaperService.subscribe((model) =>
      keepMainWindowRendering(window, model.preferences.enabled),
    );
    playbackBrokerIpc ??= bindPlaybackBrokerIpc(playbackBroker, {
      getAuthorityWindow: options.getMainWindow,
      getReplicaWindows: () => [
        options.getMainWindow(),
        getDesktopLyricWindow(),
        getDynamicIslandWindow(),
        getTaskbarLyricWindow(),
        controllerWindow?.getWindow() ?? null,
        getTrayWindow(),
      ],
      onAuthorityConnected: (senderId) => {
        brokerLog.info("[playback] main renderer authority connected", { senderId });
      },
      onRejected: (message) => brokerLog.warn(`[playback-broker] ${message}`),
    });
    void mcpRuntime.start(desktopConfig.mcp);
    audioFeatureBroker ??= initializeAudioFeatureBrokerIpc({
      getPublisherWindow: options.getMainWindow,
      getSubscriberWindows: () => [controllerWindow?.getWindow() ?? null],
      onRejected: (message) => brokerLog.warn(`[audio-feature-broker] ${message}`),
    });
    initializeUpdater(window, desktopConfig.updater);

    const revealMainWindow = async () => {
      if (wallpaperDriver?.isWallpaperActive()) {
        await wallpaperService?.configure({ enabled: false });
        return;
      }
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    };
    if (process.platform === "darwin") {
      initMacTray({
        playback: playbackGateway,
        getWallpaperService: () => wallpaperService,
        getPlaybackAnchor: () => playbackBroker?.getBootstrap()?.anchor ?? null,
        showMainWindow: async (path) => {
          await revealMainWindow();
          if (path && !window.isDestroyed()) window.webContents.send("navigate-to", path);
        },
      });
    } else {
      initTray(window, { onMainWindowRequested: revealMainWindow });
    }
    initializeLoginWindow(window);
  }

  return {
    attach,
    async dispose() {
      stopWallpaperRenderingSync?.();
      stopWallpaperRenderingSync = null;
      await wallpaperService?.dispose();
      wallpaperDriver = null;
      playbackBrokerIpc?.dispose();
      playbackBrokerIpc = null;
      const activeMcpRuntime = mcpRuntime;
      mcpRuntime = null;
      // Stop accepting MCP work before releasing the Gateway/Broker that its
      // handlers depend on. The application shutdown coordinator awaits this.
      await activeMcpRuntime?.dispose();
      taskbarProgress?.dispose();
      taskbarProgress = null;
      playbackGateway?.dispose();
      playbackGateway = null;
      playbackBroker?.dispose();
      playbackBroker = null;
      audioFeatureBroker?.dispose();
      audioFeatureBroker = null;
      controllerWindow?.dispose();
      controllerWindow = null;
      wallpaperService = null;
    },
    async restoreWallpaper() {
      if (!wallpaperService?.getModel().preferences.enabled) return;
      await wallpaperService.configure({ enabled: false });
    },
    isWallpaperActive: () => wallpaperDriver?.isWallpaperActive() ?? false,
    waitUntilReady: waitForDesktopPlaybackWallpaperInitialization,
  };
}
