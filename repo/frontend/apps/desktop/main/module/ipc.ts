import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { app, BrowserWindow, dialog, ipcMain, screen, session, shell } from "electron";
import {
  DESKTOP_BRIDGE_PROTOCOL_VERSION,
  type DesktopHostConfig,
  type CacheCategory,
  type CacheScope,
  type ClearDesktopCacheRequest,
  type DesktopBridgeCapability,
  type DiscordPresenceSnapshot,
  type RendererLogEvent,
  type DesktopVideoExportSaveRequest,
} from "@scopify/desktop-contract";
import type { DesktopBackendController } from "./backend.js";
import { loadDesktopHostConfig, saveDesktopHostConfig } from "../config.js";
import {
  cleanOldLogs,
  configureLogging,
  getCurrentLogFilePath,
  getLogDirectory,
  logger,
} from "../constants.js";
import { loginWindow } from "./login.js";
import { assertSafeCacheRoot, createPageCacheStore, migrateCacheRoot } from "./pageCache.js";
import { applyElectronProxy } from "./proxy.js";
import { getRememberedAppCloseAction, isAppCloseAction } from "./appCloseAction.js";
import { isAppCloseWindowSender } from "./appCloseWindow.js";
import type { createDiscordPresenceController } from "./discordPresence.js";
import { updateThumbarButtons } from "./thumbarButtons.js";
import { trayWindow } from "./tray.js";
import {
  checkForUpdates,
  configureUpdater,
  downloadUpdate,
  getUpdateState,
  quitAndInstallUpdate,
} from "./updater.js";
import {
  clearMusicSessionCookie,
  readMusicSessionCookie,
  saveMusicSessionCookie,
} from "./musicCookieStore.js";
import { onDesktopLyricPlaybackStateChanged } from "./desktopLyric.js";
import { resolveVideoExportWindowBounds } from "./videoExportWindow.js";

interface VideoExportWindowRestoreState {
  bounds: Electron.Rectangle;
  isFullScreen: boolean;
  isMaximized: boolean;
}

function createConfiguredPageCacheStore() {
  const config = loadDesktopHostConfig();
  return createPageCacheStore({
    config: config.cache,
    defaultDir: join(app.getPath("userData"), "cache"),
  });
}

function configuredCacheRoot(config: DesktopHostConfig) {
  return config.cache.dir.trim() || join(app.getPath("userData"), "cache");
}

export function registerIpcHandlers(
  mainWindow: BrowserWindow | null,
  discordPresence: ReturnType<typeof createDiscordPresenceController>,
  backendController: DesktopBackendController,
) {
  let hasAuthorizedDeveloperToolsOpen = false;
  let videoExportWindowRestoreState: VideoExportWindowRestoreState | null = null;
  mainWindow?.webContents.on("devtools-opened", () => {
    const isAllowed = hasAuthorizedDeveloperToolsOpen && loadDesktopHostConfig().app.devTools;
    hasAuthorizedDeveloperToolsOpen = false;
    if (!isAllowed) mainWindow.webContents.closeDevTools();
  });

  ipcMain.handle("bridge:get-info", () => ({
    capabilities: [
      "app-lifecycle",
      "backend",
      "audio-feature-transport",
      "cache",
      "config",
      "developer-tools",
      "desktop-icons",
      "desktop-lyrics",
      "desktop-playback-wallpaper",
      "discord-presence",
      "login",
      "logs",
      "media-controls",
      "navigation",
      "playback-transport",
      "renderer-logging",
      "updates",
      "video-export",
      "window-controls",
    ] satisfies DesktopBridgeCapability[],
    desktopVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    protocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
  }));

  ipcMain.handle("backend:get-status", () => backendController.getStatus());
  const unsubscribeBackendStatus = backendController.onStatusChanged((status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("backend:status-changed", status);
    }
  });
  mainWindow?.once("closed", unsubscribeBackendStatus);

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
  ipcMain.handle("logger:get-directory", () => getLogDirectory());
  ipcMain.handle("logger:open-current", async (event) => {
    if (!isMainRenderer(event, mainWindow)) return false;
    const error = await shell.openPath(getCurrentLogFilePath());
    if (error) {
      logger.warn("[logger] failed to open current log:", error);
      return false;
    }
    return true;
  });
  ipcMain.handle("logger:open-directory", async (event) => {
    if (!isMainRenderer(event, mainWindow)) return false;
    const error = await shell.openPath(getLogDirectory());
    if (error) {
      logger.warn("[logger] failed to open log directory:", error);
      return false;
    }
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
    onDesktopLyricPlaybackStateChanged(isPlaying);
  });

  ipcMain.handle("discord-presence:get-status", () => discordPresence.getStatus());
  ipcMain.handle("discord-presence:test-connection", () => discordPresence.testConnection());
  ipcMain.handle("discord-presence:publish", (_event, snapshot: DiscordPresenceSnapshot) =>
    discordPresence.publishSnapshot(snapshot),
  );

  ipcMain.handle("updater:get-status", () => getUpdateState());
  ipcMain.handle("updater:check", () => checkForUpdates());
  ipcMain.handle("updater:download", () => downloadUpdate());
  ipcMain.on("updater:quit-and-install", () => quitAndInstallUpdate());

  ipcMain.handle("dialog:select-directory", async (event, defaultPath?: string) => {
    if (!isMainRenderer(event, mainWindow)) return null;
    const options: Electron.OpenDialogOptions = {
      properties: ["openDirectory"],
      defaultPath:
        typeof defaultPath === "string" && defaultPath.trim() ? defaultPath.trim() : undefined,
    };
    const result =
      mainWindow && !mainWindow.isDestroyed()
        ? await dialog.showOpenDialog(mainWindow, options)
        : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("video-export:get-capture-source", (event) => {
    if (!isMainRenderer(event, mainWindow) || !mainWindow || mainWindow.isDestroyed()) return null;
    return { id: mainWindow.getMediaSourceId(), name: mainWindow.getTitle() };
  });

  ipcMain.handle("video-export:prepare-window", (event, size: unknown) => {
    if (!isMainRenderer(event, mainWindow) || !mainWindow || mainWindow.isDestroyed()) return false;
    if (!isVideoExportSize(size)) return false;
    if (!videoExportWindowRestoreState) {
      videoExportWindowRestoreState = {
        bounds: mainWindow.getBounds(),
        isFullScreen: mainWindow.isFullScreen(),
        isMaximized: mainWindow.isMaximized(),
      };
    }
    if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    const currentBounds = mainWindow.getBounds();
    const display = screen.getDisplayMatching(videoExportWindowRestoreState.bounds);
    mainWindow.setBounds(
      resolveVideoExportWindowBounds({
        currentBounds,
        workArea: display.workArea,
        scaleFactor: display.scaleFactor,
        target: size,
      }),
      false,
    );
    mainWindow.focus();
    return true;
  });

  ipcMain.handle("video-export:restore-window", (event) => {
    if (!isMainRenderer(event, mainWindow) || !mainWindow || mainWindow.isDestroyed()) return false;
    if (videoExportWindowRestoreState) {
      const restoreState = videoExportWindowRestoreState;
      videoExportWindowRestoreState = null;
      mainWindow.setBounds(restoreState.bounds, false);
      if (restoreState.isFullScreen) mainWindow.setFullScreen(true);
      else if (restoreState.isMaximized) mainWindow.maximize();
    }
    return true;
  });

  ipcMain.handle("video-export:select-file", async (event, request: unknown) => {
    if (!isMainRenderer(event, mainWindow) || !isVideoExportSaveRequest(request)) return null;
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: request.defaultPath,
      filters: [{ name: request.formatName, extensions: [request.extension] }],
    });
    return result.canceled ? null : (result.filePath ?? null);
  });

  ipcMain.handle("video-export:write-file", async (event, filePath: unknown, data: unknown) => {
    if (
      !isMainRenderer(event, mainWindow) ||
      typeof filePath !== "string" ||
      !(data instanceof ArrayBuffer)
    )
      return false;
    await writeFile(filePath, Buffer.from(data));
    return true;
  });

  ipcMain.handle("config:get-host", () => {
    return loadDesktopHostConfig();
  });

  ipcMain.handle("config:update-host", async (event, newConfig: DesktopHostConfig) => {
    if (!isMainRenderer(event, mainWindow)) throw new Error("Unauthorized config update.");
    logger.info("[IPC] config:update-host", newConfig);
    const currentConfig = loadDesktopHostConfig();
    // Instantiate once so a pre-scoped `music-pages` directory is promoted to
    // `page` before copying the configured root elsewhere.
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

  ipcMain.handle("cache:get", (event, key: string) => {
    if (!isMainRenderer(event, mainWindow) || typeof key !== "string") return null;
    return createConfiguredPageCacheStore().get(key);
  });

  ipcMain.handle("cache:set", (event, key: string, value: unknown, ttlMs: number) => {
    if (
      !isMainRenderer(event, mainWindow) ||
      typeof key !== "string" ||
      !Number.isFinite(ttlMs) ||
      ttlMs <= 0
    )
      return false;
    createConfiguredPageCacheStore().set(key, value, ttlMs);
    return true;
  });

  ipcMain.handle("cache:delete", (event, key: string) => {
    if (!isMainRenderer(event, mainWindow) || typeof key !== "string") return false;
    createConfiguredPageCacheStore().delete(key);
    return true;
  });

  ipcMain.handle("cache:clear", (event) => {
    if (!isMainRenderer(event, mainWindow)) return null;
    const store = createConfiguredPageCacheStore();
    store.clear();
    return store.getStats();
  });

  ipcMain.handle("cache:get-stats", (event) => {
    if (!isMainRenderer(event, mainWindow)) return null;
    return createConfiguredPageCacheStore().getStats();
  });

  ipcMain.handle("cache:get-scoped", (event, scope: unknown, key: unknown) => {
    if (!isMainRenderer(event, mainWindow) || !isCacheScope(scope) || typeof key !== "string")
      return null;
    return createConfiguredPageCacheStore().getScoped(scope, key);
  });

  ipcMain.handle(
    "cache:set-scoped",
    (event, scope: unknown, key: unknown, value: unknown, ttlMs: unknown, category: unknown) => {
      if (
        !isMainRenderer(event, mainWindow) ||
        !isCacheScope(scope) ||
        typeof key !== "string" ||
        typeof ttlMs !== "number" ||
        !Number.isFinite(ttlMs) ||
        ttlMs <= 0 ||
        (category !== undefined && !isCacheCategoryForScope(scope, category))
      ) {
        return false;
      }
      createConfiguredPageCacheStore().setScoped(scope, key, value, ttlMs, category);
      return true;
    },
  );

  ipcMain.handle("cache:delete-scoped", (event, scope: unknown, key: unknown) => {
    if (!isMainRenderer(event, mainWindow) || !isCacheScope(scope) || typeof key !== "string")
      return false;
    createConfiguredPageCacheStore().deleteScoped(scope, key);
    return true;
  });

  ipcMain.handle("cache:get-all-stats", (event) => {
    if (!isMainRenderer(event, mainWindow)) return null;
    return createConfiguredPageCacheStore().getStatsAll();
  });

  ipcMain.handle("cache:clear-selected", (event, request: unknown) => {
    if (!isMainRenderer(event, mainWindow) || !isClearCacheRequest(request)) return null;
    return createConfiguredPageCacheStore().clear(request);
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
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("navigate-to", path);
  });

  ipcMain.on("app-close-action", (event, action: unknown, remember: unknown) => {
    if (!isAppCloseWindowSender(event.sender.id)) {
      logger.warn("[app-close] rejected action from an unexpected renderer");
      return;
    }
    if (!isAppCloseAction(action) || typeof remember !== "boolean") return;

    const rememberedAction = getRememberedAppCloseAction(action, remember);
    if (rememberedAction !== null) {
      try {
        const config = loadDesktopHostConfig();
        saveDesktopHostConfig({
          ...config,
          app: { ...config.app, closeAction: rememberedAction },
        });
      } catch (error) {
        logger.error("[app-close] failed to persist the remembered action", error);
      }
    }

    if (action === "minimize" || action === "cancel") {
      const actionWindow = BrowserWindow.fromWebContents(event.sender);
      if (actionWindow && actionWindow !== mainWindow) actionWindow.close();
      if (action === "minimize") mainWindow?.hide();
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
      const persistedValue = musicUMatch ? `MUSIC_U=${value}` : value;

      if (!value) {
        clearMusicSessionCookie();
      } else {
        saveMusicSessionCookie(persistedValue);
      }

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

  ipcMain.on("get-music-cookie", (event) => {
    event.returnValue = readMusicSessionCookie();
  });
}

function isMainRenderer(event: Electron.IpcMainInvokeEvent, mainWindow: BrowserWindow | null) {
  return Boolean(
    mainWindow && !mainWindow.isDestroyed() && event.sender.id === mainWindow.webContents.id,
  );
}

function isVideoExportSize(value: unknown): value is { width: number; height: number } {
  if (!value || typeof value !== "object") return false;
  const size = value as { width?: unknown; height?: unknown };
  return [size.width, size.height].every(
    (dimension) =>
      typeof dimension === "number" &&
      Number.isInteger(dimension) &&
      dimension >= 240 &&
      dimension <= 4320,
  );
}

function isVideoExportSaveRequest(value: unknown): value is DesktopVideoExportSaveRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<DesktopVideoExportSaveRequest>;
  return (
    typeof request.defaultPath === "string" &&
    typeof request.formatName === "string" &&
    (request.extension === "mp4" || request.extension === "webm")
  );
}

function isCacheScope(value: unknown): value is CacheScope {
  return value === "page" || value === "playback";
}

function isCacheCategoryForScope(scope: CacheScope, value: unknown): value is CacheCategory {
  const page = ["album", "artist", "daily", "playlist", "search", "other"];
  const playback = [
    "play-url",
    "online-lyric",
    "lyric-match",
    "imported-lyric",
    "lyric-source",
    "other",
  ];
  return typeof value === "string" && (scope === "page" ? page : playback).includes(value);
}

function isClearCacheRequest(value: unknown): value is ClearDesktopCacheRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<ClearDesktopCacheRequest>;
  return (
    isCacheScope(request.scope) &&
    Array.isArray(request.categories) &&
    request.categories.length > 0 &&
    request.categories.every((category) => isCacheCategoryForScope(request.scope!, category))
  );
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
