import { app, dialog, Menu, type BrowserWindow } from "electron";

import { __iconDock, desktopConfig } from "@main/constants";
import { backendLog, coreLog, initLogger, logger, sessionLog } from "@main/utils/logger";
import { createDesktopBackendController } from "@main/services/backend";
import { createDiscordPresenceController } from "@main/services/discordPresence";
import { createDesktopRendererHost } from "@main/services/rendererHost";
import { loadDesktopHostConfig } from "@main/store";
import { restoreMusicSessionCookies } from "@main/utils/musicCookieStore";
import { applyElectronProxy } from "@main/utils/proxy";
import { initThumbarButtons } from "@main/utils/thumbarButtons";
import { disposeAppCloseWindow } from "@main/window/appCloseWindow";
import { createMainWindow, notifyMainWindowVisibility } from "@main/window/mainWindow";
import { createSplashWindowController } from "@main/window/splash";
import { scheduleStartupUpdateCheck } from "@main/services/updater";
import { createWindowCapabilityHost } from "./capabilityHost";

let mainWindow: BrowserWindow | null = null;
let creatingWindow = false;
let quitting = false;
let initialized = false;

const renderer = createDesktopRendererHost();
const splash = createSplashWindowController();
const backend = createDesktopBackendController({ log: backendLog }, desktopConfig.backend);
const discord = createDiscordPresenceController({
  getApplicationId: () => loadDesktopHostConfig().discord.applicationId,
  isEnabled: () => loadDesktopHostConfig().discord.enabled,
  onStatusChange: (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("discord-presence:status-changed", status);
    }
  },
});
const capabilities = createWindowCapabilityHost({
  backendController: backend,
  discordPresence: discord,
  getMainWindow: () => mainWindow,
  rendererBaseUrl: renderer.baseUrl,
});

/** Create the UI without making managed Backend availability part of the critical startup path. */
async function createApplicationWindow() {
  if (mainWindow || creatingWindow) return;
  creatingWindow = true;
  splash.begin();

  void backend
    .reconcile(loadDesktopHostConfig().backend)
    .then((status) => {
      if (status.state === "error") {
        logger.error("[backend] startup failed; continuing into the app", status.error);
      }
    })
    .catch((error) => logger.error("[backend] startup reconciliation failed", error));

  try {
    mainWindow = createMainWindow({
      isQuitting: () => quitting,
      onBeforeLoad: capabilities.attach,
      onClosed: () => {
        mainWindow = null;
      },
      onRendererReady: releaseMainWindow,
      renderer,
    });
  } catch (error) {
    splash.dismiss();
    throw error;
  } finally {
    creatingWindow = false;
  }
}

async function releaseMainWindow(window: BrowserWindow) {
  await capabilities.waitUntilReady().catch((error) => {
    logger.error("[desktop-playback-wallpaper] initialization failed", error);
  });
  notifyMainWindowVisibility(window);
  if (capabilities.isWallpaperActive()) splash.dismiss();
  else await splash.reveal(window);
  if (process.platform === "win32" && !window.isDestroyed()) initThumbarButtons(window);
}

async function prepareApplication() {
  logger.info("[app] renderer base URL", { url: renderer.baseUrl });
  if (process.platform === "win32") {
    app.setAppUserModelId("com.momo.scopify");
    // autoHideMenuBar still reveals Electron's native menu when Alt is pressed.
    Menu.setApplicationMenu(null);
  }

  const verification = renderer.verify();
  if (verification && !verification.ok) {
    logger.error(`[renderer] ${verification.message}`);
    dialog.showErrorBox("Renderer verification failed", verification.message);
    app.quit();
    return;
  }
  if (verification?.ok) logger.info("[renderer] verified artifact", verification.manifest);

  await applyElectronProxy(desktopConfig).catch((error) => {
    logger.error("[proxy] failed to apply startup proxy config", error);
  });
  await restoreMusicSessionCookies(`http://127.0.0.1:${desktopConfig.backend.port}`).catch(
    (error) => logger.warn("[session] failed to restore the legacy music session", error),
  );
  await createApplicationWindow().catch((error) => {
    logger.error("[window] failed to create the main window", error);
  });

  if (process.platform === "darwin") {
    try {
      app.dock?.setIcon(__iconDock);
    } catch (error) {
      logger.error("[app] failed to set the macOS Dock icon", error);
    }
  }
  if (mainWindow) scheduleStartupUpdateCheck();
}

function configureChromium() {
  if (process.platform === "win32" || process.platform === "darwin") {
    const current = app.commandLine.getSwitchValue("enable-features");
    const feature = "ReleaseVideoSourceProviderIfNotInUse";
    app.commandLine.appendSwitch("enable-features", current ? `${current},${feature}` : feature);
  }
  if (!desktopConfig.app.gpuAcceleration) {
    app.disableHardwareAcceleration();
    coreLog.warn("[app] hardware acceleration disabled by configuration");
  }
}

function registerLifecycle() {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.on("activate", () => {
    if (!mainWindow) void createApplicationWindow();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("before-quit", () => {
    quitting = true;
    sessionLog.info("[session] shutdown");
    splash.dismiss();
    disposeAppCloseWindow();
    capabilities.dispose();
    void discord.destroy();
    void backend.dispose();
  });
}

function registerFatalErrorHandlers() {
  const exitWithError = (title: string, reason: unknown) => {
    logger.error(title, reason);
    const message = reason instanceof Error ? reason.message : String(reason);
    dialog.showErrorBox(title, `应用遇到了未处理的错误，即将退出。\n\n${message}`);
    app.exit(1);
  };
  process.on("uncaughtException", (error) => exitWithError("发生未捕获的异常", error));
  process.on("unhandledRejection", (reason) => exitWithError("发生未处理的 Promise 拒绝", reason));
}

/** Register the process lifecycle once; all implementation lives behind the modules above. */
export function initializeApplication() {
  if (initialized) return;
  initialized = true;
  initLogger();
  configureChromium();

  if (!app.requestSingleInstanceLock()) {
    coreLog.warn("[app] another instance is already running");
    app.quit();
    return;
  }

  registerLifecycle();
  registerFatalErrorHandlers();
  void app.whenReady().then(prepareApplication);
}
