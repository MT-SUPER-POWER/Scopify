import { app, type BrowserWindow, ipcMain, session } from "electron";
import { loadAppConfig, saveAppConfig } from "../config.js";
import { appConfig, logger } from "../constants.js";
import { ensureBackendUrl, getBackendStartupStatus } from "./backend.js";
import { loginWindow } from "./login.js";
import { applyElectronProxy } from "./proxy.js";
import { updateThumbarButtons } from "./thumbarButtons.js";
import { trayWindow } from "./tray.js";

export function registerIpcHandlers(mainWindow: BrowserWindow | null) {
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

  ipcMain.handle("backend:get-url", async () => ensureBackendUrl());
  ipcMain.handle("backend:get-status", async () => getBackendStartupStatus());
  ipcMain.on("backend:get-url-sync", (event) => {
    event.returnValue = ensureBackendUrl();
  });

  ipcMain.handle("get-app-config", () => {
    const config = loadAppConfig();
    logger.info("[IPC] get-app-config", config);
    return config;
  });

  ipcMain.handle("update-app-config", async (_event, newConfig) => {
    logger.info("[IPC] update-app-config", newConfig);
    const savedConfig = saveAppConfig(newConfig);
    await applyElectronProxy(savedConfig).catch((error) => {
      logger.error("[IPC] failed to apply proxy after config update:", error);
    });
    return savedConfig;
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

  ipcMain.handle("set-music-cookie", async (_event, cookieStr: string) => {
    try {
      const musicUMatch = cookieStr.match(/MUSIC_U=([^;]+)/);
      const value = musicUMatch ? musicUMatch[1] : cookieStr;
      const url = `http://${appConfig.backend.host}`;

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
