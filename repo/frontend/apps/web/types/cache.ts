import type {
  CacheCategory,
  CacheScope,
  ClearDesktopCacheRequest,
  DesktopCacheStats,
} from "@scopifymusicplayer/desktop-contract";
import type { NeteaseLyric } from "@/types/api/music";
import type { MusicQuality } from "@/types/player";

export type { CacheCategory, CacheScope } from "@scopifymusicplayer/desktop-contract";

export type CacheStats = DesktopCacheStats;
export type CacheClearRequest = ClearDesktopCacheRequest;
export type CacheSelectionKey = `${CacheScope}:${CacheCategory}`;

export interface CacheScopePreferences {
  enabled: boolean;
  maxSizeMB: number;
}

export interface PageCachePreferences extends CacheScopePreferences {
  searchTtlMinutes: number;
  ttlMinutes: number;
}

export interface PlaybackCachePreferences extends CacheScopePreferences {
  lyricTtlMinutes: number;
  maxEntries: number;
  urlTtlMinutes: number;
}

export interface CachePreferences {
  page: PageCachePreferences;
  playback: PlaybackCachePreferences;
}

/** Legacy shared playback record retained only to read pre-split cache entries. */
export interface PlaybackSongCacheEntry {
  cachedAt: number;
  lyric: NeteaseLyric | null;
  lyricCachedAt?: number;
  url: Partial<Record<MusicQuality, string>>;
  urlCachedAt?: Partial<Record<MusicQuality, number>>;
}

export interface CacheSelectionSummary {
  entryCount: number;
  sizeBytes: number;
}

export interface CacheClearResult extends CacheSelectionSummary {
  failedCategories: CacheSelectionKey[];
}
