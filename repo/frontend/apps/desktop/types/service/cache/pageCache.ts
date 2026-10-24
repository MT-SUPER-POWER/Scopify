import type {
  CacheCategory,
  CacheScope,
  ClearDesktopCacheRequest,
  DesktopCacheStats,
  DesktopHostConfig,
} from "@scopify/desktop-contract";
export interface PageCacheStats {
  dir: string;
  entryCount: number;
  sizeBytes: number;
}

export interface CacheEntry<T> {
  category: CacheCategory;
  createdAt: number;
  expiresAt: number;
  key: string;
  value: T;
}

export interface LegacyPageCacheEntry {
  createdAt: number;
  expiresAt: number;
  key: string;
}

export interface PageCacheStoreOptions {
  config: DesktopHostConfig["cache"];
  defaultDir: string;
  now?: () => number;
}

export interface PageCacheStore {
  clear(request?: ClearDesktopCacheRequest): DesktopCacheStats;
  delete(key: string): void;
  deleteScoped(scope: CacheScope, key: string): void;
  get<T = unknown>(key: string): T | null;
  getScoped<T = unknown>(scope: CacheScope, key: string): T | null;
  getStats(): PageCacheStats;
  getStatsAll(): DesktopCacheStats;
  set<T = unknown>(key: string, value: T, ttlMs: number): void;
  setScoped<T = unknown>(
    scope: CacheScope,
    key: string,
    value: T,
    ttlMs: number,
    category?: CacheCategory,
  ): void;
}
