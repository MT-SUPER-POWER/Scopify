import { appConfig } from "@/lib/web/env";

const WEB_CACHE_KEY = "scopify-page-cache-store";
const OLD_WEB_CACHE_PREFIX = "scopify-page-cache:";
const MAX_WEB_CACHE_ENTRIES = 50;
const MINUTE = 60 * 1000;

interface WebCacheEntry<T> {
  accessedAt: number;
  expiresAt: number;
  value: T;
}

type WebCacheStore = Record<string, WebCacheEntry<unknown>>;

let _cleanedUpOldCache = false;

export type PageCacheNamespace = "album" | "artist" | "daily" | "playlist" | "search";

export async function clearPageCache() {
  if (typeof window !== "undefined" && window.electronAPI?.clearPageCache) {
    return window.electronAPI.clearPageCache();
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(WEB_CACHE_KEY);
  }

  return { dir: "localStorage", entryCount: 0, sizeBytes: 0 };
}

export function createPageCacheKey(
  namespace: PageCacheNamespace,
  parts: (boolean | null | number | string | undefined)[],
) {
  return [namespace, ...parts.filter((part) => part !== null && part !== undefined)]
    .map((part) => encodeURIComponent(String(part)))
    .join(":");
}

export function dailyTtlMs(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(tomorrow.getTime() - now.getTime(), MINUTE);
}

export async function deletePageCache(key: string) {
  if (typeof window !== "undefined" && window.electronAPI?.deletePageCache) {
    await window.electronAPI.deletePageCache(key);
    return;
  }

  if (typeof window !== "undefined") {
    const store = getWebCacheStore();
    let modified = false;
    for (const k of Object.keys(store)) {
      if (k === key || k.startsWith(`${key}:`)) {
        delete store[k];
        modified = true;
      }
    }
    if (modified) saveWebCacheStore(store);
  }
}

export async function getPageCache<T = unknown>(key: string): Promise<null | T> {
  if (typeof window !== "undefined" && window.electronAPI?.getPageCache) {
    return window.electronAPI.getPageCache<T>(key);
  }

  return readWebCache<T>(key);
}

export async function invalidateMusicPageCache(kind?: PageCacheNamespace) {
  if (!kind) {
    await clearPageCache();
    return;
  }

  await deletePageCache(kind);
}

export function pageTtlMs(minutes = appConfig.cache.pageTtlMinutes) {
  return minutes * MINUTE;
}

export function searchTtlMs(minutes = appConfig.cache.searchTtlMinutes) {
  return minutes * MINUTE;
}

export async function setPageCache<T = unknown>(key: string, value: T, ttlMs: number) {
  if (typeof window !== "undefined" && window.electronAPI?.setPageCache) {
    await window.electronAPI.setPageCache(key, value, ttlMs);
    return;
  }

  writeWebCache(key, value, ttlMs);
}

function getWebCacheStore(): WebCacheStore {
  if (typeof window === "undefined") return {};
  try {
    if (!_cleanedUpOldCache) {
      _cleanedUpOldCache = true;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(OLD_WEB_CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    const raw = localStorage.getItem(WEB_CACHE_KEY);
    return raw ? (JSON.parse(raw) as WebCacheStore) : {};
  } catch {
    return {};
  }
}

function readWebCache<T>(key: string): null | T {
  if (typeof window === "undefined") return null;

  const store = getWebCacheStore();
  const entry = store[key] as undefined | WebCacheEntry<T>;

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    delete store[key];
    saveWebCacheStore(store);
    return null;
  }

  entry.accessedAt = Date.now();
  saveWebCacheStore(store);

  return entry.value;
}

function saveWebCacheStore(store: WebCacheStore) {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(store);
    if (keys.length > MAX_WEB_CACHE_ENTRIES) {
      const sorted = keys.sort((a, b) => store[b].accessedAt - store[a].accessedAt);
      for (let i = MAX_WEB_CACHE_ENTRIES; i < sorted.length; i++) {
        delete store[sorted[i]];
      }
    }
    localStorage.setItem(WEB_CACHE_KEY, JSON.stringify(store));
  } catch {
    // Best-effort web fallback. Electron uses the durable file cache.
  }
}

function writeWebCache<T>(key: string, value: T, ttlMs: number) {
  if (typeof window === "undefined") return;

  const store = getWebCacheStore();
  store[key] = {
    accessedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    value,
  };
  saveWebCacheStore(store);
}
