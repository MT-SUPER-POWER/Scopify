import { join } from "node:path";
import { app, type BrowserWindow, ipcMain, session } from "electron";
import {
  DESKTOP_BRIDGE_PROTOCOL_VERSION,
  type DesktopHostConfig,
  type DesktopBridgeCapability,
  type RendererLogEvent,
} from "@scopify/desktop-contract";
import { loadDesktopHostConfig, saveDesktopHostConfig } from "../config.js";
import { logger } from "../constants.js";
import { loginWindow } from "./login.js";
import { createPageCacheStore } from "./pageCache.js";
import { applyElectronProxy } from "./proxy.js";
import { updateThumbarButtons } from "./thumbarButtons.js";
import { trayWindow } from "./tray.js";
import {
  checkForUpdates,
  configureUpdater,
  downloadUpdate,
  getUpdateState,
  quitAndInstallUpdate,
} from "./updater.js";

function createConfiguredPageCacheStore() {
  const config = loadDesktopHostConfig();
  return createPageCacheStore({
    config: config.cache,
    defaultDir: join(app.getPath("userData"), "cache", "music-pages"),
  });
}

export function registerIpcHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle("bridge:get-info", () => ({
    capabilities: [
      "app-lifecycle",
      "cache",
      "config",
      "desktop-icons",
      "desktop-lyrics",
      "desktop-playback-wallpaper",
      "login",
      "media-controls",
      "navigation",
      "renderer-logging",
      "updates",
      "window-controls",
    ] satisfies DesktopBridgeCapability[],
    desktopVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    protocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
  }));

  ipcMain.handle("logger:write", (event, payload: RendererLogEvent) => {
    if (!isRendererLogEvent(payload)) return false;

    const metadata = payload.metadata
      ? { ...payload.metadata, rendererId: event.sender.id }
      : { rendererId: event.sender.id };
    if (payload.level === "debug") logger.debug(`[renderer] ${payload.message}`, metadata);
    else if (payload.level === "info") logger.info(`[renderer] ${payload.message}`, metadata);
    else if (payload.level === "warn") logger.warn(`[renderer] ${payload.message}`, metadata);
    else logger.error(`[renderer] ${payload.message}`, metadata);
    return true;
  });

  ipcMain.on("relaunch-app", () => {
    logger.info("[IPC] relaunch requested");
    app.relaunch();
    app.quit();
  });

  ipcMain.on("player-state-changed", (_event, { isPlaying }: { isPlaying: boolean }) => {
    if (mainWindow) {
      updateThumbarButtons(mainWindow, isPlaying);
    }
  });

  ipcMain.handle("updater:get-status", () => getUpdateState());
  ipcMain.handle("updater:check", () => checkForUpdates());
  ipcMain.handle("updater:download", () => downloadUpdate());
  ipcMain.on("updater:quit-and-install", () => quitAndInstallUpdate());

  ipcMain.handle("config:get-host", () => {
    const config = loadDesktopHostConfig();
    logger.info("[IPC] config:get-host", config);
    return config;
  });

  ipcMain.handle("config:update-host", async (_event, newConfig: DesktopHostConfig) => {
    logger.info("[IPC] config:update-host", newConfig);
    const savedConfig = saveDesktopHostConfig(newConfig);
    configureUpdater(savedConfig.updater);
    await applyElectronProxy(savedConfig).catch((error) => {
      logger.error("[IPC] failed to apply proxy after config update:", error);
    });
    return savedConfig;
  });

  ipcMain.handle("cache:get", (_event, key: string) => {
    return createConfiguredPageCacheStore().get(key);
  });

  ipcMain.handle("cache:set", (_event, key: string, value: unknown, ttlMs: number) => {
    createConfiguredPageCacheStore().set(key, value, ttlMs);
    return true;
  });

  ipcMain.handle("cache:delete", (_event, key: string) => {
    createConfiguredPageCacheStore().delete(key);
    return true;
  });

  ipcMain.handle("cache:clear", () => {
    const store = createConfiguredPageCacheStore();
    store.clear();
    return store.getStats();
  });

  ipcMain.handle("cache:get-stats", () => {
    return createConfiguredPageCacheStore().getStats();
  });

  ipcMain.on("login-success", () => {
    logger.info("[IPC] login success");
    loginWindow?.close();
    mainWindow?.reload();
  });

  ipcMain.on("update-titlebar-color", (_event, color) => {
    if (!mainWindow) return;
    mainWindow.setTitleBarOverlay({
      color: "rgba(0,0,0,0)",
      height: 35,
      symbolColor: color,
    });
  });

  ipcMain.on("window-enter-full-screen", () => {
    mainWindow?.setFullScreen(true);
  });

  ipcMain.on("window-exit-full-screen", () => {
    mainWindow?.setFullScreen(false);
  });

  ipcMain.on("main-window-reload", () => {
    mainWindow?.reload();
  });

  ipcMain.on("navigate-main-window", (_event, path) => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("navigate-to", path);
  });

  ipcMain.on("app-close-action", (_event, action) => {
    if (action === "minimize") {
      mainWindow?.hide();
      return;
    }

    if (action === "exit") {
      app.quit();
    }
  });

  ipcMain.on("exit-app", () => {
    app.quit();
  });

  ipcMain.on("minimize-to-tray", () => {
    mainWindow?.hide();
    trayWindow?.hide();
  });

  ipcMain.handle("set-music-cookie", async (_event, cookieStr: string, backendOrigin: string) => {
    try {
      const musicUMatch = cookieStr.match(/MUSIC_U=([^;]+)/);
      const value = musicUMatch ? musicUMatch[1] : cookieStr;
      const url = parseAllowedBackendOrigin(backendOrigin);

      await session.defaultSession.cookies.set({
        url,
        name: "MUSIC_U",
        value,
        path: "/",
        sameSite: "no_restriction",
        expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60,
      });

      logger.info("[IPC] set-music-cookie success");
      return true;
    } catch (error) {
      logger.error("[IPC] set-music-cookie failed", error);
      throw error;
    }
  });
}

function parseAllowedBackendOrigin(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Backend origin must use HTTP or HTTPS.");
  }
  return url.origin;
}

function isRendererLogEvent(value: unknown): value is RendererLogEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<RendererLogEvent>;
  return (
    typeof event.message === "string" &&
    (event.level === "debug" ||
      event.level === "info" ||
      event.level === "warn" ||
      event.level === "error")
  );
}
