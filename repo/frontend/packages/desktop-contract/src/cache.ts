export type CacheScope = "page" | "playback";

export type PageCacheCategory = "album" | "artist" | "daily" | "playlist" | "search" | "other";
export type PlaybackCacheCategory =
  "play-url" | "online-lyric" | "lyric-match" | "imported-lyric" | "lyric-source" | "other";
export type CacheCategory = PageCacheCategory | PlaybackCacheCategory;

export interface CacheCategoryStats {
  category: CacheCategory;
  entryCount: number;
  sizeBytes: number;
}

export interface CacheScopeStats {
  categories: CacheCategoryStats[];
  dir: string;
  enabled: boolean;
  entryCount: number;
  maxSizeMB: number;
  scope: CacheScope;
  sizeBytes: number;
}

export interface DesktopCacheStats {
  page: CacheScopeStats;
  playback: CacheScopeStats;
  rootDir: string;
}

export interface ClearDesktopCacheRequest {
  categories: CacheCategory[];
  scope: CacheScope;
}
