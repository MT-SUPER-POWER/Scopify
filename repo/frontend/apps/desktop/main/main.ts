// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LIBRARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BrowserWindow as BrowserWindowType } from "electron";
import { app, BrowserWindow, dialog, Menu } from "electron";
import serve from "electron-serve";
import {
  __iconDock,
  __iconWindow,
  __preloadScript,
  __rendererDir,
  __splashHtmlPath,
  desktopConfig,
  cleanOldLogs,
  logger,
} from "./constants.js";
import { verifyRendererArtifact } from "../lib/rendererArtifact.js";
import { loadDesktopHostConfig } from "./config.js";
import { createDiscordPresenceController } from "./module/discordPresence.js";
import { disposeAppCloseWindow, showAppCloseWindow } from "./module/appCloseWindow.js";
import { registerIpcHandlers } from "./module/ipc.js";
import { createDesktopBackendController } from "./module/backend.js";
import { getDesktopLyricWindow, initializeDesktopLyricCompanion } from "./module/desktopLyric.js";
import { initializeDesktopIconVisibilityCapability } from "./module/desktopIcons/index.js";
import { initializeDesktopPlaybackWallpaperCapability } from "./module/desktopPlaybackWallpaper/index.js";
import {
  createElectronDesktopPlaybackWallpaperDriver,
  type ElectronDesktopPlaybackWallpaperDriver,
} from "./module/desktopPlaybackWallpaper/electronDriver.js";
import {
  createDesktopPlaybackControllerWindow,
  type DesktopPlaybackControllerWindow,
} from "./module/desktopPlaybackWallpaper/controllerWindow.js";
import {
  initializePlaybackBrokerIpc,
  type PlaybackBrokerIpcHost,
} from "./module/playbackBroker/ipc.js";
import {
  initializeAudioFeatureBrokerIpc,
  type AudioFeatureBrokerIpcHost,
} from "./module/audioFeatureBroker/ipc.js";
import initializeLoginWindow from "./module/login.js";
import { applyElectronProxy } from "./module/proxy.js";
import { initThumbarButtons } from "./module/thumbarButtons.js";
import initTray, { trayWindow } from "./module/tray.js";
import { initializeUpdater, scheduleStartupUpdateCheck } from "./module/updater.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ VARIABLES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let splashWindow: BrowserWindowType | null = null;
let mainWindow: BrowserWindowType | null = null;
let mainWindowReleased = false;
let isCreatingWindow = false;
let isQuitting = false;
let desktopPlaybackWallpaperDriver: ElectronDesktopPlaybackWallpaperDriver | null = null;
let desktopPlaybackControllerWindow: DesktopPlaybackControllerWindow | null = null;
let playbackBrokerIpcHost: PlaybackBrokerIpcHost | null = null;
let audioFeatureBrokerIpcHost: AudioFeatureBrokerIpcHost | null = null;
const backendController = createDesktopBackendController({ log: logger }, desktopConfig.backend);
let splashShownAtMs = 0;
let resolveSplashReady: (() => void) | null = null;
let splashReady = Promise.resolve();

const SPLASH_MINIMUM_VISIBLE_MS = 900;
const SPLASH_READY_TIMEOUT_MS = 1_500;

const useStaticRenderer = app.isPackaged || process.env.ELECTRON_RENDERER_MODE === "static";
const appServe: ((win: BrowserWindowType) => Promise<void>) | null = useStaticRenderer
  ? serve({ directory: __rendererDir })
  : null;

const devBase = `http://${desktopConfig.frontend.host}:${desktopConfig.frontend.devPort}`;
const rendererBaseUrl = useStaticRenderer ? "app://-/" : devBase;
const gotTheLock = app.requestSingleInstanceLock();

logger.info("--------------------------------------------------");
logger.info("Fronted Base URL is", devBase);
logger.info("--------------------------------------------------");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FUNCTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function destroySplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy();
  }
  splashWindow = null;
}

async function waitForSplashVisibility() {
  await Promise.race([
    splashReady,
    new Promise<void>((resolve) => setTimeout(resolve, SPLASH_READY_TIMEOUT_MS)),
  ]);

  const remainingMs = Math.max(0, SPLASH_MINIMUM_VISIBLE_MS - (Date.now() - splashShownAtMs));
  if (remainingMs > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, remainingMs));
  }
}

async function revealMainWindow() {
  if (!mainWindow || mainWindowReleased || mainWindow.isDestroyed()) return;

  await waitForSplashVisibility();
  if (!mainWindow || mainWindowReleased || mainWindow.isDestroyed()) return;

  mainWindowReleased = true;
  destroySplashWindow();

  mainWindow.setAlwaysOnTop(true);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);

  if (process.platform === "win32") {
    initThumbarButtons(mainWindow);
  }
}

function createSplashWindow() {
  mainWindowReleased = false;
  splashShownAtMs = 0;
  splashReady = new Promise((resolve) => {
    resolveSplashReady = resolve;
  });

  splashWindow = new BrowserWindow({
    width: 700,
    height: 700,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: __iconWindow,
    resizable: false,
    show: false,
    movable: false,
    skipTaskbar: true,
  });

  splashWindow.once("ready-to-show", () => {
    if (!splashWindow || splashWindow.isDestroyed()) return;
    splashShownAtMs = Date.now();
    splashWindow.show();
    splashWindow.center();
    splashWindow.focus();
    resolveSplashReady?.();
    resolveSplashReady = null;
  });
  splashWindow.webContents.once("did-fail-load", (_event, code, description) => {
    logger.error(`[splash] Failed to load (${code}): ${description}`);
    resolveSplashReady?.();
    resolveSplashReady = null;
  });
  splashWindow.loadFile(__splashHtmlPath).catch((error) => {
    logger.error("[splash] Failed to load:", error);
    resolveSplashReady?.();
    resolveSplashReady = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 840,
    minHeight: 720,
    autoHideMenuBar: true,
    icon: __iconWindow,
    title: "Scopify",
    show: false,
    titleBarOverlay: {
      color: "rgba(0,0,0,0)",
      height: 35,
      symbolColor: "white",
    },
    webPreferences: {
      backgroundThrottling: false,
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
      offscreen: false,
    },
  });

  // The Main renderer owns the Authority, so its broker listeners must exist
  // before `loadURL` can mount the React playback runtime.
  setupWindowModules(mainWindow);

  mainWindow.webContents.once("did-finish-load", () => {
    void revealMainWindow();
    setTimeout(() => {
      desktopPlaybackControllerWindow?.prepare();
      desktopPlaybackWallpaperDriver?.prepare();
    }, 500);
  });

  if (useStaticRenderer) {
    if (!appServe) {
      logger.error("[renderer] appServe is not initialized in static renderer mode.");
    } else {
      appServe(mainWindow).catch((err) => {
        logger.error("[renderer] Failed to load static renderer via app:// protocol:", err);
        const fallbackIndex = join(__rendererDir, "index.html");
        mainWindow?.loadFile(fallbackIndex).catch((fallbackErr) => {
          logger.error("[renderer] Fallback loadFile also failed:", fallbackErr);
        });
      });
    }
  } else {
    mainWindow.loadURL(devBase);

    mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
      logger.error("Did fail load:", code, desc);
      mainWindow?.webContents.reloadIgnoringCache();
    });
  }

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if ((input.control || input.meta) && input.key === "0") {
      event.preventDefault();
    }

    if ((input.control || input.meta) && (input.key === "=" || input.key === "+")) {
      event.preventDefault();
    }

    if ((input.control || input.meta) && input.key === "-") {
      event.preventDefault();
    }
  });

  mainWindow.on("enter-full-screen", () => {
    mainWindow?.webContents.send("window-full-screen-changed", { isFullScreen: true });
  });

  mainWindow.on("leave-full-screen", () => {
    mainWindow?.webContents.send("window-full-screen-changed", { isFullScreen: false });
  });

  mainWindow.on("close", (e: Electron.Event) => {
    if (isQuitting) return;

    e.preventDefault();
    const closeAction = loadDesktopHostConfig().app.closeAction;
    if (closeAction === 0) {
      mainWindow?.hide();
      return;
    }

    if (closeAction === 1) {
      app.quit();
      return;
    }

    if (mainWindow) showAppCloseWindow(mainWindow, rendererBaseUrl);
  });

  mainWindow.on("closed", () => {
    mainWindowReleased = false;
    mainWindow = null;
  });
}

async function createWindow() {
  if (mainWindow || isCreatingWindow) return;

  isCreatingWindow = true;
  createSplashWindow();

  try {
    const backendConfig = loadDesktopHostConfig().backend;
    void backendController
      .reconcile(backendConfig)
      .then((status) => {
        if (status.state === "error") {
          logger.error(
            "[backend] managed backend startup failed; continuing into the app:",
            status.error,
          );
        }
      })
      .catch((error) => {
        logger.error(
          "[backend] managed backend startup reconciliation failed; continuing into the app:",
          error,
        );
      });

    createMainWindow();
  } catch (error) {
    destroySplashWindow();
    throw error;
  } finally {
    isCreatingWindow = false;
  }
}

const discordPresenceController = createDiscordPresenceController({
  getApplicationId: () => loadDesktopHostConfig().discord.applicationId,
  isEnabled: () => loadDesktopHostConfig().discord.enabled,
  onStatusChange: (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("discord-presence:status-changed", status);
    }
  },
});

function setupWindowModules(win: BrowserWindowType) {
  desktopPlaybackWallpaperDriver ??= createElectronDesktopPlaybackWallpaperDriver({
    rendererBaseUrl,
  });
  desktopPlaybackControllerWindow ??= createDesktopPlaybackControllerWindow({
    rendererBaseUrl,
  });
  registerIpcHandlers(win, discordPresenceController, backendController);
  initializeDesktopIconVisibilityCapability(win, {
    getControllerWindow: desktopPlaybackControllerWindow.getWindow,
  });
  initializeDesktopLyricCompanion(win, {
    rendererBaseUrl,
  });
  initializeDesktopPlaybackWallpaperCapability(win, {
    controller: desktopPlaybackControllerWindow,
    driver: desktopPlaybackWallpaperDriver,
    getControllerWindow: desktopPlaybackControllerWindow.getWindow,
    getWallpaperWindow: desktopPlaybackWallpaperDriver.getWindow,
  });
  playbackBrokerIpcHost ??= initializePlaybackBrokerIpc({
    // Main owns the only media element and is therefore the only Authority.
    // Companion, tray and wallpaper windows remain read-only Replicas.
    getAuthorityWindow: () => mainWindow,
    getReplicaWindows: () => [
      mainWindow,
      getDesktopLyricWindow(),
      desktopPlaybackControllerWindow?.getWindow() ?? null,
      desktopPlaybackWallpaperDriver?.getWindow() ?? null,
      trayWindow,
    ],
    onAuthorityConnected: (senderId) => {
      logger.info("[playback] main renderer authority connected", { senderId });
    },
    onRejected: (message) => logger.warn(`[playback-broker] ${message}`),
  });
  audioFeatureBrokerIpcHost ??= initializeAudioFeatureBrokerIpc({
    getPublisherWindow: () => mainWindow,
    getSubscriberWindows: () => [
      desktopPlaybackWallpaperDriver?.getWindow() ?? null,
      desktopPlaybackControllerWindow?.getWindow() ?? null,
    ],
    onRejected: (message) => logger.warn(`[audio-feature-broker] ${message}`),
  });
  initializeUpdater(win, desktopConfig.updater);

  if (process.platform !== "darwin") {
    initTray(win);
  }

  initializeLoginWindow(win);
}

if (!desktopConfig.app.gpuAcceleration) {
  app.disableHardwareAcceleration();
  logger.warn("[app] Hardware acceleration disabled based on config.");
}

if (!gotTheLock) {
  logger.warn("Another instance is already running. Quitting this one...");
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    logger.info("Scopify ready, creating window...");

    // autoHideMenuBar still reveals Electron's native menu when Alt is pressed on Windows.
    if (process.platform === "win32") Menu.setApplicationMenu(null);

    if (useStaticRenderer) {
      const rendererVerification = verifyRendererArtifact(__rendererDir);
      if (!rendererVerification.ok) {
        logger.error(`[renderer] ${rendererVerification.message}`);
        dialog.showErrorBox("Renderer verification failed", rendererVerification.message);
        app.quit();
        return;
      }
      logger.info("[renderer] verified artifact", rendererVerification.manifest);
    }

    await applyElectronProxy(desktopConfig).catch((error) => {
      logger.error("[proxy] failed to apply startup proxy config:", error);
    });

    try {
      await createWindow();
    } catch (err) {
      logger.error("Failed to create main window:", err);
    }

    if (process.platform === "darwin") {
      try {
        app.dock?.setIcon(__iconDock);
      } catch (err) {
        logger.error("Failed to set Mac dock icon:", err);
      }
    }

    if (mainWindow) scheduleStartupUpdateCheck();

    cleanOldLogs();

    app.on("activate", () => {
      if (mainWindow !== null) return;
      void createWindow().catch((error) => {
        logger.error("Failed to recreate main window:", error);
      });
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
    logger.info("[session] shutdown");
    disposeAppCloseWindow();
    playbackBrokerIpcHost?.dispose();
    playbackBrokerIpcHost = null;
    audioFeatureBrokerIpcHost?.dispose();
    audioFeatureBrokerIpcHost = null;
    void discordPresenceController.destroy();
    void backendController.dispose();
    desktopPlaybackControllerWindow?.dispose();
    desktopPlaybackControllerWindow = null;
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    dialog.showErrorBox(
      "发生未捕获的异常",
      `应用遇到了一个未处理的错误，应用将退出。\n\n错误信息:\n${err.message}`,
    );
    app.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
    dialog.showErrorBox(
      "发生未处理的 Promise 拒绝",
      `应用遇到了一个未处理的 Promise 错误，应用将退出。\n\n错误信息:\n${reason}`,
    );
    app.exit(1);
  });
}
