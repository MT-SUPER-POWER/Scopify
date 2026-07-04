// lib/cache/playbackCache.ts
// ── Playback Data Cache ────────────────────────────────────────────────────────
// 双后端设计：
//   Electron → 复用 cache:* IPC（文件存储，路径 = cache.dir）
//   Web      → IndexedDB（idb-keyval）
// LRU 列表，最多 100 首，超限淘汰最旧。

import { del, get, set } from "idb-keyval";
import type { MusicQuality } from "@/store/module/player";
import type { NeteaseLyric } from "@/types/api/music";

export const PLAYBACK_CACHE_MAX = 100;

// ── Constants ──────────────────────────────────────────────────────────────────

const URL_TTL_MS = 30 * 60 * 1000; // 30 分钟
const LYRIC_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时

const KEY_PREFIX_SONG = "playback-song";
const KEY_LRU = "playback-lru";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SongCacheEntry {
  url: Partial<Record<MusicQuality, string>>;
  lyric: NeteaseLyric | null;
  cachedAt: number;
}

// ── Storage Backend ────────────────────────────────────────────────────────────
// Electron → IPC; Web → IndexedDB (idb-keyval)

function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

async function storageGet<T>(key: string): Promise<T | null> {
  if (isElectron()) {
    return window.electronAPI!.getPageCache<T>(key);
  }
  try {
    const val = await get<T>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

async function storageSet<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  if (isElectron()) {
    await window.electronAPI!.setPageCache(key, value, ttlMs ?? URL_TTL_MS);
    return;
  }
  try {
    await set(key, value);
  } catch {
    // IndexedDB 不可用时静默降级
  }
}

async function storageDelete(key: string): Promise<void> {
  if (isElectron()) {
    await window.electronAPI!.deletePageCache(key);
    return;
  }
  try {
    await del(key);
  } catch {
    // 静默
  }
}

// ── LRU ────────────────────────────────────────────────────────────────────────

async function readLru(): Promise<number[]> {
  const list = await storageGet<number[]>(KEY_LRU);
  return list ?? [];
}

async function writeLru(list: number[]): Promise<void> {
  await storageSet(KEY_LRU, list.slice(0, PLAYBACK_CACHE_MAX), 365 * 24 * 60 * 60 * 1000);
}

/** 把 songId 移到 LRU 头部，超限时淘汰末尾并返回被淘汰的 ID */
async function touchLru(songId: number): Promise<number | null> {
  const list = await readLru();

  // 若已存在，删除旧位置
  const idx = list.indexOf(songId);
  if (idx !== -1) list.splice(idx, 1);

  // 插入头部
  list.unshift(songId);

  // 超限淘汰
  let evicted: number | null = null;
  if (list.length > PLAYBACK_CACHE_MAX) {
    evicted = list.pop() ?? null;
  }

  await writeLru(list);
  return evicted;
}

// ── Public API: Play URL ───────────────────────────────────────────────────────

export async function getCachedPlayUrl(
  songId: number,
  quality: MusicQuality,
): Promise<string | null> {
  const entry = await storageGet<SongCacheEntry>(`${KEY_PREFIX_SONG}:${songId}`);
  if (!entry) return null;

  // 30 分钟软过期
  if (Date.now() - entry.cachedAt > URL_TTL_MS) return null;

  return entry.url[quality] ?? null;
}

export async function setCachedPlayUrl(
  songId: number,
  quality: MusicQuality,
  url: string,
): Promise<void> {
  const entry = (await storageGet<SongCacheEntry>(`${KEY_PREFIX_SONG}:${songId}`)) ?? {
    url: {},
    lyric: null,
    cachedAt: 0,
  };

  entry.url[quality] = url;
  entry.cachedAt = Date.now();

  await storageSet(`${KEY_PREFIX_SONG}:${songId}`, entry, URL_TTL_MS);
  const evicted = await touchLru(songId);

  // 淘汰旧数据
  if (evicted != null && evicted !== songId) {
    await storageDelete(`${KEY_PREFIX_SONG}:${evicted}`);
  }
}

// ── Public API: Lyric ──────────────────────────────────────────────────────────

export async function getCachedLyric(songId: number): Promise<NeteaseLyric | null> {
  const entry = await storageGet<SongCacheEntry>(`${KEY_PREFIX_SONG}:${songId}`);
  if (!entry?.lyric) return null;

  // 24 小时硬过期
  if (Date.now() - entry.cachedAt > LYRIC_TTL_MS) return null;

  return entry.lyric;
}

export async function setCachedLyric(songId: number, lyric: NeteaseLyric): Promise<void> {
  const entry = (await storageGet<SongCacheEntry>(`${KEY_PREFIX_SONG}:${songId}`)) ?? {
    url: {},
    lyric: null,
    cachedAt: 0,
  };

  entry.lyric = lyric;
  entry.cachedAt = Date.now();

  await storageSet(`${KEY_PREFIX_SONG}:${songId}`, entry, LYRIC_TTL_MS);
  const evicted = await touchLru(songId);

  if (evicted != null && evicted !== songId) {
    await storageDelete(`${KEY_PREFIX_SONG}:${evicted}`);
  }
}

// ── Public API: Cache Management ───────────────────────────────────────────────

export async function clearPlaybackCache(): Promise<{ entryCount: number }> {
  const lru = await readLru();
  const count = lru.length;

  // 删除所有歌曲缓存
  for (const songId of lru) {
    await storageDelete(`${KEY_PREFIX_SONG}:${songId}`);
  }

  // 删除 LRU 列表
  await storageDelete(KEY_LRU);

  return { entryCount: count };
}

export async function getPlaybackCacheStats(): Promise<{
  entryCount: number;
  cacheDir: string | null;
}> {
  const lru = await readLru();

  let cacheDir: string | null = null;
  if (isElectron()) {
    try {
      const stats = await window.electronAPI!.getPageCacheStats();
      cacheDir = stats.dir;
    } catch {
      // 静默
    }
  }

  return { entryCount: lru.length, cacheDir };
}
