import {
  DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES,
  type DesktopIconVisibilityState,
  type DesktopPlaybackWallpaperModel,
  type PageCacheStats,
} from "@scopify/desktop-contract";

import type { AppUpdateState } from "@/types/updater";

import type { WebRuntime } from "../types";

const WEB_CACHE_KEY = "scopify-page-cache-store";
const OLD_WEB_CACHE_PREFIX = "scopify-page-cache:";
const MAX_WEB_CACHE_ENTRIES = 50;
const NOOP = () => undefined;

interface WebCacheEntry<T> {
  accessedAt: number;
  expiresAt: number;
  value: T;
}

type WebCacheStore = Record<string, WebCacheEntry<unknown>>;

export interface BrowserRuntimeEnvironment {
  readonly document?: {
    cookie: string;
    readonly documentElement: { requestFullscreen?(): Promise<void> };
    exitFullscreen?(): Promise<void>;
    readonly fullscreenElement: Element | null;
    addEventListener(type: "fullscreenchange", callback: () => void): void;
    removeEventListener(type: "fullscreenchange", callback: () => void): void;
  };
  readonly storage?: Pick<Storage, "getItem" | "key" | "length" | "removeItem" | "setItem">;
}

function unsupportedUpdateState(): AppUpdateState {
  return { currentVersion: "", status: "unsupported", supported: false };
}

function unsupportedDesktopPlaybackWallpaperModel(): DesktopPlaybackWallpaperModel {
  return {
    preferences: {
      ...DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES,
      layers: { ...DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES.layers },
    },
    status: {
      diagnostic: "Desktop playback wallpaper requires the Windows desktop runtime.",
      state: "unsupported",
    },
  };
}

function unsupportedDesktopIconVisibilityState(): DesktopIconVisibilityState {
  return {
    diagnostic: "Desktop icon visibility control requires Windows Explorer.",
    supported: false,
    visible: null,
  };
}

function getDefaultEnvironment(): BrowserRuntimeEnvironment {
  return {
    document: typeof document === "undefined" ? undefined : document,
    storage: typeof localStorage === "undefined" ? undefined : localStorage,
  };
}

export function createBrowserRuntime(
  environment: BrowserRuntimeEnvironment = getDefaultEnvironment(),
): WebRuntime {
  let cleanedOldCache = false;

  const readStore = (): WebCacheStore => {
    const storage = environment.storage;
    if (!storage) return {};

    try {
      if (!cleanedOldCache) {
        cleanedOldCache = true;
        const oldKeys: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key?.startsWith(OLD_WEB_CACHE_PREFIX)) oldKeys.push(key);
        }
        oldKeys.forEach((key) => storage.removeItem(key));
      }

      const raw = storage.getItem(WEB_CACHE_KEY);
      return raw ? (JSON.parse(raw) as WebCacheStore) : {};
    } catch {
      return {};
    }
  };

  const writeStore = (store: WebCacheStore) => {
    const storage = environment.storage;
    if (!storage) return;

    try {
      const keys = Object.keys(store);
      if (keys.length > MAX_WEB_CACHE_ENTRIES) {
        const sorted = keys.sort((left, right) => store[right].accessedAt - store[left].accessedAt);
        for (let index = MAX_WEB_CACHE_ENTRIES; index < sorted.length; index += 1) {
          delete store[sorted[index]];
        }
      }
      storage.setItem(WEB_CACHE_KEY, JSON.stringify(store));
    } catch {
      // Browser cache is best-effort; quota and privacy-mode failures are non-fatal.
    }
  };

  const stats = (): PageCacheStats => {
    const serialized = environment.storage?.getItem(WEB_CACHE_KEY) ?? "";
    return {
      dir: "localStorage",
      entryCount: Object.keys(readStore()).length,
      sizeBytes: serialized.length * 2,
    };
  };

  return {
    app: {
      exit: NOOP,
      onCloseRequested: () => NOOP,
      relaunch: NOOP,
      submitCloseAction: NOOP,
    },
    auth: {
      completeLogin: () => false,
      openLoginWindow: () => false,
      persistMusicCookie: async (cookie) => {
        if (!environment.document) return false;
        const musicUMatch = /MUSIC_U=([^;]+)/.exec(cookie);
        environment.document.cookie = `MUSIC_U=${musicUMatch?.[1] ?? ""}; path=/; max-age=${60 * 60 * 24 * 30}`;
        return true;
      },
    },
    cache: {
      clear: async () => {
        environment.storage?.removeItem(WEB_CACHE_KEY);
        return stats();
      },
      delete: async (key) => {
        const store = readStore();
        let modified = false;
        for (const storedKey of Object.keys(store)) {
          if (storedKey === key || storedKey.startsWith(`${key}:`)) {
            delete store[storedKey];
            modified = true;
          }
        }
        if (modified) writeStore(store);
      },
      get: async <T>(key: string) => {
        const store = readStore();
        const entry = store[key] as WebCacheEntry<T> | undefined;
        if (!entry) return null;
        if (entry.expiresAt <= Date.now()) {
          delete store[key];
          writeStore(store);
          return null;
        }
        entry.accessedAt = Date.now();
        writeStore(store);
        return entry.value;
      },
      set: async (key, value, ttlMs) => {
        const store = readStore();
        store[key] = {
          accessedAt: Date.now(),
          expiresAt: Date.now() + ttlMs,
          value,
        };
        writeStore(store);
      },
      stats: async () => stats(),
    },
    config: {
      loadHostConfig: async () => null,
      saveHostConfig: async () => null,
    },
    desktopIcons: {
      getVisibility: async () => unsupportedDesktopIconVisibilityState(),
      setVisibility: async () => unsupportedDesktopIconVisibilityState(),
    },
    desktopLyrics: {
      close: async () => false,
      getPreferences: async () => null,
      onCommand: () => NOOP,
      sendCommand: NOOP,
      updatePreferences: async () => null,
    },
    desktopPlaybackWallpaper: {
      closeController: async () => false,
      configure: async () => unsupportedDesktopPlaybackWallpaperModel(),
      getModel: async () => unsupportedDesktopPlaybackWallpaperModel(),
      onAudioFrame: () => NOOP,
      onModelChanged: () => NOOP,
      publishAudioFrame: NOOP,
      retry: async () => unsupportedDesktopPlaybackWallpaperModel(),
      setControllerLayout: async () => false,
      showController: async () => ({ opened: false, reason: "unsupported" }),
    },
    isDesktop: false,
    kind: "browser",
    logging: { write: async () => false },
    media: {
      onCommand: () => NOOP,
      setPlaying: NOOP,
    },
    navigation: {
      navigateMainWindow: () => false,
      onNavigate: () => NOOP,
    },
    playback: {
      connect: () => NOOP,
      send: () => false,
    },
    updates: {
      check: async () => unsupportedUpdateState(),
      download: async () => unsupportedUpdateState(),
      getStatus: async () => unsupportedUpdateState(),
      install: NOOP,
      onStatusChanged: () => NOOP,
    },
    window: {
      minimize: NOOP,
      onFullscreenChanged: (callback) => {
        const doc = environment.document;
        if (!doc) return NOOP;
        const onChange = () => callback(Boolean(doc.fullscreenElement));
        doc.addEventListener("fullscreenchange", onChange);
        return () => doc.removeEventListener("fullscreenchange", onChange);
      },
      setFullscreen: async (fullscreen) => {
        const doc = environment.document;
        if (!doc) return;
        if (fullscreen) await doc.documentElement.requestFullscreen?.();
        else if (doc.fullscreenElement) await doc.exitFullscreen?.();
      },
    },
  };
}
