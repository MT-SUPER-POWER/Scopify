// lib/cache/playbackCache.ts
// ── Playback Data Cache ────────────────────────────────────────────────────────
// 缓存歌曲播放 URL 和歌词，减少 API 重复请求。
// URL 缓存 30 分钟（网易云 URL 有有效期），歌词缓存 24 小时。

import type { NeteaseLyric } from "@/types/api/music";
import type { MusicQuality } from "@/store/module/player";

const CACHE_PREFIX_URL = "playback-cache:url";
const CACHE_PREFIX_LYRIC = "playback-cache:lyric";
const URL_TTL_MS = 30 * 60 * 1000;        // 30 分钟
const LYRIC_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T, ttlMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { expiresAt: Date.now() + ttlMs, value };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage 满时静默失败（best-effort cache）
  }
}

// ── Play URL ────────────────────────────────────────────────────────────────────

export function getCachedPlayUrl(songId: number, quality: MusicQuality): string | null {
  return readCache<string>(`${CACHE_PREFIX_URL}:${songId}:${quality}`);
}

export function setCachedPlayUrl(songId: number, quality: MusicQuality, url: string): void {
  writeCache(`${CACHE_PREFIX_URL}:${songId}:${quality}`, url, URL_TTL_MS);
}

// ── Lyric ───────────────────────────────────────────────────────────────────────

export function getCachedLyric(songId: number): NeteaseLyric | null {
  return readCache<NeteaseLyric>(`${CACHE_PREFIX_LYRIC}:${songId}`);
}

export function setCachedLyric(songId: number, lyric: NeteaseLyric): void {
  writeCache(`${CACHE_PREFIX_LYRIC}:${songId}`, lyric, LYRIC_TTL_MS);
}

// ── Clear ───────────────────────────────────────────────────────────────────────

/** 不传 songId 则清空所有播放缓存 */
export function clearPlaybackCache(songId?: number): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage);

  if (songId != null) {
    const urlPrefix = `${CACHE_PREFIX_URL}:${songId}`;
    const lyricPrefix = `${CACHE_PREFIX_LYRIC}:${songId}`;
    keys
      .filter((key) => key.startsWith(urlPrefix) || key.startsWith(lyricPrefix))
      .forEach((key) => localStorage.removeItem(key));
  } else {
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX_URL) || key.startsWith(CACHE_PREFIX_LYRIC))
      .forEach((key) => localStorage.removeItem(key));
  }
}
