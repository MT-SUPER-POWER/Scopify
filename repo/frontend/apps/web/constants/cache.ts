import type { CacheCategory, CacheScope, CacheSelectionKey } from "@/types/cache";

export const CACHE_SCOPE_CATEGORIES: Record<CacheScope, readonly CacheCategory[]> = {
  page: ["album", "artist", "daily", "playlist", "search", "other"],
  playback: ["play-url", "online-lyric", "lyric-match", "imported-lyric", "lyric-source", "other"],
};

export function getCacheSelectionKey(
  scope: CacheScope,
  category: CacheCategory,
): CacheSelectionKey {
  return `${scope}:${category}`;
}

export const DEFAULT_CACHE_SELECTION_KEYS: readonly CacheSelectionKey[] = [
  getCacheSelectionKey("page", "album"),
  getCacheSelectionKey("page", "artist"),
  getCacheSelectionKey("page", "daily"),
  getCacheSelectionKey("page", "playlist"),
  getCacheSelectionKey("page", "search"),
  getCacheSelectionKey("page", "other"),
  getCacheSelectionKey("playback", "play-url"),
  getCacheSelectionKey("playback", "online-lyric"),
];
