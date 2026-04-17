import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BrowserWindow as BrowserWindowType } from "electron";
import { app, BrowserWindow, dialog } from "electron";
import serve from "electron-serve";
import {
  __logoIcon,
  __logoIconMacPath,
  __preloadScript,
  __splashHtmlPath,
  appConfig,
  cleanOldLogs,
  logger,
} from "./constants.js";
import {
  getBackendStartupStatus,
  startManagedBackend,
  stopManagedBackend,
} from "./module/backend.js";
import { registerIpcHandlers } from "./module/ipc.js";
import initializeLoginWindow from "./module/login.js";
import { applyElectronProxy } from "./module/proxy.js";
import { initThumbarButtons } from "./module/thumbarButtons.js";
import initTray from "./module/tray.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let splashWindow: BrowserWindowType | null = null;
let mainWindow: BrowserWindowType | null = null;
let mainWindowLoaded = false;
let mainWindowReleased = false;
let isQuitting = false;

const appServe: ((win: BrowserWindowType) => Promise<void>) | null = app.isPackaged
  ? serve({ directory: join(__dirname, "../../renderer") })
  : null;

const devPort = appConfig.frontend.devPort;
const devBase = `http://localhost:${devPort}`;
const gotTheLock = app.requestSingleInstanceLock();

logger.info("--------------------------------------------------");
logger.info("Fronted Base URL is", devBase);
logger.info("--------------------------------------------------");

function destroySplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy();
  }
  splashWindow = null;
}

function revealMainWindow() {
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

function sendBackendStatusToRenderer() {
  if (!mainWindow || !mainWindowLoaded || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("backend-status-changed", getBackendStartupStatus());
}

function maybeRevealMainWindow() {
  const backendStatus = getBackendStartupStatus();
  if (!mainWindow || !mainWindowLoaded || mainWindowReleased) return;
  if (backendStatus.state === "starting") return;
  revealMainWindow();
}

function createWindow() {
  mainWindowLoaded = false;
  mainWindowReleased = false;

  splashWindow = new BrowserWindow({
    width: 700,
    height: 700,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: __logoIcon,
    resizable: false,
    show: true,
    movable: false,
    type: "toolbar",
  });

  splashWindow.loadFile(__splashHtmlPath);
  splashWindow.center();
  splashWindow.focus();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 840,
    minHeight: 720,
    autoHideMenuBar: true,
    icon: __logoIcon,
    title: "Scopify",
    show: false,
    titleBarOverlay: {
      color: "rgba(0,0,0,0)",
      height: 35,
      symbolColor: "white",
    },
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
      offscreen: false,
    },
  });

  // Only reveal the main window after both renderer and backend are ready.
  mainWindow.webContents.once("did-finish-load", () => {
    mainWindowLoaded = true;
    sendBackendStatusToRenderer();
    maybeRevealMainWindow();
  });

  if (app.isPackaged) {
    if (!appServe) {
      logger.error("[renderer] appServe is not initialized in packaged mode.");
    } else {
      appServe(mainWindow).catch((err) => {
        logger.error("[renderer] Failed to load packaged renderer via app:// protocol:", err);
        const fallbackIndex = join(__dirname, "../../renderer/index.html");
        mainWindow?.loadFile(fallbackIndex).catch((fallbackErr) => {
          logger.error("[renderer] Fallback loadFile also failed:", fallbackErr);
        });
      });
    }
  } else {
    mainWindow.loadURL(devBase);

    if (appConfig.app.devTools) {
      mainWindow.webContents.openDevTools();
    }

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

    const isDevToolsKey =
      input.key === "F12" ||
      ((input.control || input.meta) && input.shift && input.key.toUpperCase() === "I") ||
      (process.platform === "darwin" && input.meta && input.alt && input.key.toUpperCase() === "I");

    if (isDevToolsKey && !appConfig.app.devTools) {
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
    mainWindow?.webContents.send("app-close-confirm");
  });

  mainWindow.on("closed", () => {
    mainWindowLoaded = false;
    mainWindowReleased = false;
    mainWindow = null;
  });
}

function setupWindowModules(win: BrowserWindowType) {
  registerIpcHandlers(win);

  if (process.platform !== "darwin") {
    initTray(win);
  }

  initializeLoginWindow(win);
}

if (!appConfig.app.gpuAcceleration) {
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

    await applyElectronProxy(appConfig).catch((error) => {
      logger.error("[proxy] failed to apply startup proxy config:", error);
    });

    const backendStartup = startManagedBackend();
    backendStartup
      .then(() => {
        logger.info("[startup] Backend is ready, releasing splash screen.");
        sendBackendStatusToRenderer();
        maybeRevealMainWindow();
      })
      .catch((err) => {
        logger.error("[startup] Backend startup failed, showing renderer fallback.", err);
        sendBackendStatusToRenderer();
        maybeRevealMainWindow();
      });

    try {
      createWindow();

      if (process.platform === "darwin") {
        app.dock?.setIcon(__logoIconMacPath);
      }
    } catch (err) {
      logger.error("Failed to create main window:", err);
    }

    if (mainWindow) {
      setupWindowModules(mainWindow);
    }

    cleanOldLogs();

    app.on("activate", () => {
      if (mainWindow !== null) return;
      createWindow();
      if (mainWindow) {
        setupWindowModules(mainWindow);
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
    stopManagedBackend();
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    dialog.showErrorBox(
      "发生未捕获的异常",
      `应用遇到了一个未处理的错误，应用将退出。\n\n错误信息:\n${err.message}`,
    );
    stopManagedBackend();
    app.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
    dialog.showErrorBox(
      "发生未处理的 Promise 拒绝",
      `应用遇到了一个未处理的 Promise 错误，应用将退出。\n\n错误信息:\n${reason}`,
    );
    stopManagedBackend();
    app.exit(1);
  });
}
