import { join } from "node:path";
import { app, ipcMain, type BrowserWindow } from "electron";
import type {
  CacheCategory,
  CacheScope,
  ClearDesktopCacheRequest,
  DesktopHostConfig,
} from "@scopify/desktop-contract";
import { loadDesktopHostConfig } from "@main/store";
import { createPageCacheStore } from "@main/services/pageCache";
import { isMainRenderer } from "./sender.js";

function createConfiguredPageCacheStore() {
  const config = loadDesktopHostConfig();
  return createPageCacheStore({
    config: config.cache,
    defaultDir: join(app.getPath("userData"), "cache"),
  });
}

export function configuredCacheRoot(config: DesktopHostConfig) {
  return config.cache.dir.trim() || join(app.getPath("userData"), "cache");
}

/** 注册页面与播放数据缓存的读写接口。所有写操作只接受主 Renderer。 */
export function registerCacheIpc(mainWindow: BrowserWindow | null) {
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
    ) {
      return false;
    }
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
