import { app, type IpcMain, type IpcMainInvokeEvent } from "electron";
import { join } from "node:path";
import type { PlaybackCacheCategory } from "@mt-super-power/desktop-contract";
import { loadDesktopHostConfig } from "../../config.js";
import { createPageCacheStore } from "../pageCache.js";

const PLAYBACK_CATEGORIES: PlaybackCacheCategory[] = [
  "play-url",
  "online-lyric",
  "lyric-match",
  "imported-lyric",
  "lyric-source",
  "other",
];

function createStore() {
  const config = loadDesktopHostConfig();
  return createPageCacheStore({
    config: config.cache,
    defaultDir: join(app.getPath("userData"), "cache"),
  });
}

function isPlaybackHost(event: IpcMainInvokeEvent) {
  try {
    return new URL(event.senderFrame?.url ?? "").pathname.startsWith("/playback-host/");
  } catch {
    return false;
  }
}

function isPlaybackCategory(value: unknown): value is PlaybackCacheCategory {
  return typeof value === "string" && PLAYBACK_CATEGORIES.includes(value as PlaybackCacheCategory);
}

/** Registers the hidden host's least-privileged cache channel. */
export function initializePlaybackHostCacheIpc(ipc: IpcMain) {
  ipc.handle("playback-host-cache:get", (event, key: unknown) => {
    if (!isPlaybackHost(event) || typeof key !== "string") return null;
    return createStore().getScoped("playback", key);
  });
  ipc.handle(
    "playback-host-cache:set",
    (event, key: unknown, value: unknown, ttlMs: unknown, category: unknown) => {
      if (
        !isPlaybackHost(event) ||
        typeof key !== "string" ||
        typeof ttlMs !== "number" ||
        !Number.isFinite(ttlMs) ||
        ttlMs <= 0 ||
        (category !== undefined && !isPlaybackCategory(category))
      ) {
        return false;
      }
      createStore().setScoped("playback", key, value, ttlMs, category);
      return true;
    },
  );
  ipc.handle("playback-host-cache:delete", (event, key: unknown) => {
    if (!isPlaybackHost(event) || typeof key !== "string") return false;
    createStore().deleteScoped("playback", key);
    return true;
  });
}
