import { runtime } from "@/lib/runtime";
import type { CacheClearRequest, CachePreferences, CacheStats } from "@/types/cache";

/**
 * The UI only needs cache-management intents. Keeping this façade separate from
 * the runtime adapter prevents settings components from depending on Electron.
 */
export function getCacheStats(): Promise<CacheStats> {
  return runtime.cache.statsAll();
}

export function clearCache(request: CacheClearRequest): Promise<CacheStats> {
  return runtime.cache.clearSelected(request);
}

export function getCachePreferences(): Promise<CachePreferences> {
  return runtime.cache.getPreferences();
}

export function saveCachePreferences(preferences: CachePreferences): Promise<CachePreferences> {
  return runtime.cache.savePreferences(preferences);
}
