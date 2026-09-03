import { join } from "node:path";
import { app, ipcMain, type BrowserWindow } from "electron";
import type { DesktopHostConfig } from "@scopify/desktop-contract";
import { loadDesktopHostConfig, saveDesktopHostConfig } from "../store/index.js";
import { cleanOldLogs, configureLogging, logger } from "../constants.js";
import type { DesktopBackendController } from "../services/backend.js";
import type { createDiscordPresenceController } from "../services/discordPresence.js";
import {
  assertSafeCacheRoot,
  createPageCacheStore,
  migrateCacheRoot,
} from "../services/pageCache.js";
import { configureUpdater } from "../services/updater.js";
import { applyElectronProxy } from "../utils/proxy.js";
import { configuredCacheRoot } from "./cache.js";
import { isMainRenderer } from "./sender.js";

/**
 * 注册 Desktop Host 配置接口，并在保存后统一协调所有受配置影响的能力。
 * 配置副作用留在 Main，避免 Renderer 需要了解日志、代理、更新器和后端的启动顺序。
 */
export function registerConfigurationIpc(
  mainWindow: BrowserWindow | null,
  backendController: DesktopBackendController,
  discordPresence: ReturnType<typeof createDiscordPresenceController>,
) {
  let hasAuthorizedDeveloperToolsOpen = false;
  mainWindow?.webContents.on("devtools-opened", () => {
    const isAllowed = hasAuthorizedDeveloperToolsOpen && loadDesktopHostConfig().app.devTools;
    hasAuthorizedDeveloperToolsOpen = false;
    if (!isAllowed) mainWindow.webContents.closeDevTools();
  });

  ipcMain.handle("config:get-host", () => loadDesktopHostConfig());
  ipcMain.handle("config:update-host", async (event, newConfig: DesktopHostConfig) => {
    if (!isMainRenderer(event, mainWindow)) throw new Error("Unauthorized config update.");
    logger.info("[IPC] config:update-host", newConfig);
    const currentConfig = loadDesktopHostConfig();
    // 先实例化旧缓存，让历史 music-pages 目录在迁移根目录之前完成升级。
    createPageCacheStore({
      config: currentConfig.cache,
      defaultDir: join(app.getPath("userData"), "cache"),
    });
    const currentRoot = configuredCacheRoot(currentConfig);
    const nextRoot = configuredCacheRoot(newConfig);
    assertSafeCacheRoot(nextRoot);
    if (currentRoot !== nextRoot) migrateCacheRoot({ from: currentRoot, to: nextRoot });

    const savedConfig = saveDesktopHostConfig(newConfig);
    configureLogging(savedConfig.logging);
    cleanOldLogs();
    if (!savedConfig.app.devTools && mainWindow?.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
    configureUpdater(savedConfig.updater);
    await backendController.reconcile(savedConfig.backend);
    void discordPresence.refresh();
    await applyElectronProxy(savedConfig).catch((error) => {
      logger.error("[IPC] failed to apply proxy after config update:", error);
    });
    return savedConfig;
  });

  ipcMain.handle("developer-tools:toggle", (event) => {
    if (!isMainRenderer(event, mainWindow) || !mainWindow || mainWindow.isDestroyed()) return false;
    if (!loadDesktopHostConfig().app.devTools) {
      if (mainWindow.webContents.isDevToolsOpened()) mainWindow.webContents.closeDevTools();
      return false;
    }
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
      return true;
    }
    hasAuthorizedDeveloperToolsOpen = true;
    mainWindow.webContents.openDevTools();
    setTimeout(() => {
      hasAuthorizedDeveloperToolsOpen = false;
    }, 1_000);
    return true;
  });
}
