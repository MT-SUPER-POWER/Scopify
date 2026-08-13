import { runtime } from "@/lib/runtime";

const MINUTE = 60 * 1000;
const DEFAULT_PAGE_TTL_MINUTES = 360;
const DEFAULT_SEARCH_TTL_MINUTES = 30;

export type PageCacheNamespace = "album" | "artist" | "daily" | "playlist" | "search";

export async function clearPageCache() {
  return runtime.cache.clear();
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
  await runtime.cache.delete(key);
}

export async function getPageCache<T = unknown>(key: string): Promise<null | T> {
  return runtime.cache.get<T>(key);
}

export async function invalidateMusicPageCache(kind?: PageCacheNamespace) {
  if (!kind) {
    await clearPageCache();
    return;
  }

  await deletePageCache(kind);
}

export function pageTtlMs(minutes = DEFAULT_PAGE_TTL_MINUTES) {
  return minutes * MINUTE;
}

export function searchTtlMs(minutes = DEFAULT_SEARCH_TTL_MINUTES) {
  return minutes * MINUTE;
}

export async function setPageCache<T = unknown>(key: string, value: T, ttlMs: number) {
  const category = pageCacheCategory(key);
  const preferences = await runtime.cache.getPreferences();
  const configuredTtlMs =
    (category === "search" ? preferences.page.searchTtlMinutes : preferences.page.ttlMinutes) *
    MINUTE;
  const effectiveTtlMs = category === "daily" ? Math.min(ttlMs, configuredTtlMs) : configuredTtlMs;
  await runtime.cache.setScoped("page", key, value, effectiveTtlMs, category);
}

function pageCacheCategory(key: string): PageCacheNamespace | "other" {
  const namespace = key.split(":", 1)[0];
  return namespace === "album" ||
    namespace === "artist" ||
    namespace === "daily" ||
    namespace === "playlist" ||
    namespace === "search"
    ? namespace
    : "other";
}
