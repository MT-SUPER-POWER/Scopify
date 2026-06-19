import { appConfig } from "@/lib/web/env";

const WEB_CACHE_PREFIX = "scopify-page-cache:";
const MINUTE = 60 * 1000;

interface WebCacheEntry<T> {
  expiresAt: number;
  value: T;
}

export type PageCacheNamespace = "playlist" | "album" | "artist" | "search" | "daily";

export function createPageCacheKey(
  namespace: PageCacheNamespace,
  parts: Array<string | number | boolean | null | undefined>,
) {
  return [namespace, ...parts.filter((part) => part !== null && part !== undefined)]
    .map((part) => encodeURIComponent(String(part)))
    .join(":");
}

export function pageTtlMs(minutes = appConfig.cache.pageTtlMinutes) {
  return minutes * MINUTE;
}

export function searchTtlMs(minutes = appConfig.cache.searchTtlMinutes) {
  return minutes * MINUTE;
}

export function dailyTtlMs(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(tomorrow.getTime() - now.getTime(), MINUTE);
}

function readWebCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(`${WEB_CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry = JSON.parse(raw) as WebCacheEntry<T>;
    if (entry.expiresAt <= Date.now()) {
      localStorage.removeItem(`${WEB_CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.value;
  } catch {
    return null;
  }
}

function writeWebCache<T>(key: string, value: T, ttlMs: number) {
  if (typeof window === "undefined") return;

  try {
    const entry: WebCacheEntry<T> = {
      expiresAt: Date.now() + ttlMs,
      value,
    };
    localStorage.setItem(`${WEB_CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Best-effort web fallback. Electron uses the durable file cache.
  }
}

export async function getPageCache<T = unknown>(key: string): Promise<T | null> {
  if (typeof window !== "undefined" && window.electronAPI?.getPageCache) {
    return window.electronAPI.getPageCache<T>(key);
  }

  return readWebCache<T>(key);
}

export async function setPageCache<T = unknown>(key: string, value: T, ttlMs: number) {
  if (typeof window !== "undefined" && window.electronAPI?.setPageCache) {
    await window.electronAPI.setPageCache(key, value, ttlMs);
    return;
  }

  writeWebCache(key, value, ttlMs);
}

export async function deletePageCache(key: string) {
  if (typeof window !== "undefined" && window.electronAPI?.deletePageCache) {
    await window.electronAPI.deletePageCache(key);
    return;
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(`${WEB_CACHE_PREFIX}${key}`);
  }
}

export async function clearPageCache() {
  if (typeof window !== "undefined" && window.electronAPI?.clearPageCache) {
    return window.electronAPI.clearPageCache();
  }

  if (typeof window !== "undefined") {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(WEB_CACHE_PREFIX))
      .forEach((key) => {
        localStorage.removeItem(key);
      });
  }

  return { dir: "localStorage", entryCount: 0, sizeBytes: 0 };
}

export async function invalidateMusicPageCache(kind?: PageCacheNamespace) {
  if (!kind) {
    await clearPageCache();
    return;
  }

  await deletePageCache(kind);
}
