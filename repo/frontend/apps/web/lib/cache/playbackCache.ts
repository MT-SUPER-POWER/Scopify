// lib/cache/playbackCache.ts
// ── Playback Data Cache ────────────────────────────────────────────────────────
// 双后端设计：
//   Electron → scoped cache IPC（文件存储，路径 = cache.dir/playback）
//   Web      → IndexedDB 的 playback object store
// Every category uses separate keys so cleanup can precisely report and delete it.

import { runtime } from "@/lib/runtime";
import type {
  ImportedLyricOverride,
  LyricMatchOverride,
  LyricSourceSelection,
} from "@/types/lyrics";
import type { MusicQuality } from "@/types/player";
import type { NeteaseLyric } from "@/types/api/music";

const URL_TTL_MS = 30 * 60 * 1000; // 30 分钟
const LYRIC_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时
const LYRIC_OVERRIDE_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

const KEY_PREFIX_PLAY_URL = "playback-play-url";
const KEY_PREFIX_ONLINE_LYRIC = "playback-online-lyric";
const KEY_PREFIX_LYRIC_OVERRIDE = "playback-lyric-override";
const KEY_PREFIX_IMPORTED_LYRIC = "playback-imported-lyric";
const KEY_PREFIX_LYRIC_SOURCE = "playback-lyric-source";

// ── Storage Backend ────────────────────────────────────────────────────────────
// The runtime chooses Electron IPC or IndexedDB. Callers never branch by host.

async function storageGet<T>(key: string): Promise<T | null> {
  return runtime.cache.getScoped<T>("playback", key);
}

async function storageSet<T>(
  key: string,
  value: T,
  ttlMs: number,
  category: "play-url" | "online-lyric" | "lyric-match" | "imported-lyric" | "lyric-source",
): Promise<void> {
  const preferences = await runtime.cache.getPreferences();
  const effectiveTtlMs =
    category === "play-url"
      ? preferences.playback.urlTtlMinutes * 60 * 1000
      : category === "online-lyric"
        ? preferences.playback.lyricTtlMinutes * 60 * 1000
        : ttlMs;
  await runtime.cache.setScoped("playback", key, value, effectiveTtlMs, category);
}

async function storageDelete(key: string): Promise<void> {
  await runtime.cache.deleteScoped("playback", key);
}

// ── Public API: Play URL ───────────────────────────────────────────────────────

export async function getCachedPlayUrl(
  songId: number,
  quality: MusicQuality,
): Promise<string | null> {
  return storageGet<string>(`${KEY_PREFIX_PLAY_URL}:${songId}:${quality}`);
}

export async function setCachedPlayUrl(
  songId: number,
  quality: MusicQuality,
  url: string,
): Promise<void> {
  await storageSet(`${KEY_PREFIX_PLAY_URL}:${songId}:${quality}`, url, URL_TTL_MS, "play-url");
}

export async function clearCachedPlayUrl(songId: number, quality: MusicQuality): Promise<void> {
  await storageDelete(`${KEY_PREFIX_PLAY_URL}:${songId}:${quality}`);
}

// ── Public API: Lyric ──────────────────────────────────────────────────────────

export async function getCachedLyric(songId: number): Promise<NeteaseLyric | null> {
  return storageGet<NeteaseLyric>(`${KEY_PREFIX_ONLINE_LYRIC}:${songId}`);
}

export async function setCachedLyric(songId: number, lyric: NeteaseLyric): Promise<void> {
  await storageSet(`${KEY_PREFIX_ONLINE_LYRIC}:${songId}`, lyric, LYRIC_TTL_MS, "online-lyric");
}

// ── Public API: Manually matched lyrics ─────────────────────────────────────────

export async function getLyricMatchOverride(songId: number): Promise<LyricMatchOverride | null> {
  return storageGet<LyricMatchOverride>(`${KEY_PREFIX_LYRIC_OVERRIDE}:${songId}`);
}

export async function setLyricMatchOverride(
  songId: number,
  override: LyricMatchOverride,
): Promise<void> {
  await storageSet(
    `${KEY_PREFIX_LYRIC_OVERRIDE}:${songId}`,
    override,
    LYRIC_OVERRIDE_TTL_MS,
    "lyric-match",
  );
}

export async function clearLyricMatchOverride(songId: number): Promise<void> {
  await storageDelete(`${KEY_PREFIX_LYRIC_OVERRIDE}:${songId}`);
}

export async function getImportedLyricOverride(
  songId: number,
): Promise<ImportedLyricOverride | null> {
  return storageGet<ImportedLyricOverride>(`${KEY_PREFIX_IMPORTED_LYRIC}:${songId}`);
}

export async function setImportedLyricOverride(
  songId: number,
  override: ImportedLyricOverride,
): Promise<void> {
  await storageSet(
    `${KEY_PREFIX_IMPORTED_LYRIC}:${songId}`,
    override,
    LYRIC_OVERRIDE_TTL_MS,
    "imported-lyric",
  );
}

export async function clearImportedLyricOverride(songId: number): Promise<void> {
  await storageDelete(`${KEY_PREFIX_IMPORTED_LYRIC}:${songId}`);
}

export async function getLyricSourceSelection(songId: number): Promise<LyricSourceSelection> {
  return (
    (await storageGet<LyricSourceSelection>(`${KEY_PREFIX_LYRIC_SOURCE}:${songId}`)) ?? "online"
  );
}

export async function setLyricSourceSelection(
  songId: number,
  source: LyricSourceSelection,
): Promise<void> {
  await storageSet(
    `${KEY_PREFIX_LYRIC_SOURCE}:${songId}`,
    source,
    LYRIC_OVERRIDE_TTL_MS,
    "lyric-source",
  );
}

export async function clearLyricSourceSelection(songId: number): Promise<void> {
  await storageDelete(`${KEY_PREFIX_LYRIC_SOURCE}:${songId}`);
}

// ── Public API: Cache Management ───────────────────────────────────────────────

export async function clearPlaybackCache(): Promise<{ entryCount: number }> {
  const before = await runtime.cache.statsAll();
  await runtime.cache.clearSelected({
    categories: [
      "play-url",
      "online-lyric",
      "lyric-match",
      "imported-lyric",
      "lyric-source",
      "other",
    ],
    scope: "playback",
  });
  return { entryCount: before.playback.entryCount };
}

export async function getPlaybackCacheStats(): Promise<{
  entryCount: number;
  cacheDir: string | null;
}> {
  const stats = await runtime.cache.statsAll();
  return { entryCount: stats.playback.entryCount, cacheDir: stats.playback.dir };
}
