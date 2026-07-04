# Playback Cache Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage-based playback cache with IndexedDB (Web) + file storage (Electron) dual backend, add LRU eviction and settings page cache management.

**Architecture:** A unified `playbackCache.ts` layer that conditionally uses Electron IPC (`cache:*`) or IndexedDB (`idb-keyval`). Each song is one key. An LRU list (max 100) tracks play order and evicts oldest entries. The settings page gets a Web+Electron dual-section for cache stats and clearing.

**Tech Stack:** `idb-keyval` (IndexedDB wrapper), Electron IPC (`cache:*`), React hooks, Zustand

## Global Constraints

- `getCachedPlayUrl`/`getCachedLyric`/`setCachedPlayUrl`/`setCachedLyric` must remain exported (player.tsx imports them)
- All four cache functions become async (return Promise)
- `clearPlaybackCache()` drops the optional `songId` parameter — becomes no-arg
- Electron backend reuses existing `window.electronAPI.getPageCache/setPageCache/deletePageCache` with `playback:` key prefix
- Web backend uses `idb-keyval` (new dependency)
- LRU max = 100 songs (`PLAYBACK_CACHE_MAX`)
- URL soft TTL = 30 minutes (checked at read time)
- Lyric hard TTL = 24 hours (checked at read time)
- Settings section visible on both Web and Electron (not wrapped in `IS_ELECTRON`)
- Existing `pageCache.ts` is NOT modified

---

### Task 1: Install `idb-keyval` dependency

**Files:**

- Modify: `package.json` (add dependency)
- Create: none (lockfile auto-updated by install command)

- [ ] **Step 1: Install `idb-keyval`**

```bash
bun add idb-keyval
```

Expected output: `bun add` resolves version (^6.2.1 or latest) and updates `package.json` + `bun.lock`.

- [ ] **Step 2: Commit**

```bash
git add package.json bun.lock
git commit -m "chore(deps): add idb-keyval for IndexedDB-backed cache"
```

---

### Task 2: Rewrite `lib/cache/playbackCache.ts`

**Files:**

- Rewrite: `lib/cache/playbackCache.ts`

**Interfaces:**

- Produces: `getCachedPlayUrl(songId, quality) => Promise<string | null>`, `setCachedPlayUrl(songId, quality, url) => Promise<void>`, `getCachedLyric(songId) => Promise<NeteaseLyric | null>`, `setCachedLyric(songId, lyric) => Promise<void>`, `clearPlaybackCache() => Promise<{ entryCount: number }>`, `getPlaybackCacheStats() => Promise<{ entryCount, cacheDir }>`, `PLAYBACK_CACHE_MAX = 100`

- [ ] **Step 1: Write the new `playbackCache.ts`**

```ts
// lib/cache/playbackCache.ts
// ── Playback Data Cache ────────────────────────────────────────────────────────
// 双后端设计：
//   Electron → 复用 cache:* IPC（文件存储，路径 = cache.dir）
//   Web      → IndexedDB（idb-keyval）
// LRU 列表，最多 100 首，超限淘汰最旧。

import { get, set, del, keys } from "idb-keyval";
import type { NeteaseLyric } from "@/types/api/music";
import type { MusicQuality } from "@/store/module/player";

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
    // Electron: 复用 cache:* IPC（主进程文件存储，路径 = cache.dir）
    // window.electronAPI.getPageCache 会返回对应 key 的缓存值
    return window.electronAPI!.getPageCache<T>(key);
  }
  // Web: IndexedDB
  try {
    const val = await get<T>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

async function storageSet<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  if (isElectron()) {
    // Electron 端的 setPageCache 自带 TTL + 文件级 LRU 淘汰
    await window.electronAPI!.setPageCache(key, value, ttlMs ?? URL_TTL_MS);
    return;
  }
  // Web: IndexedDB（不设 TTL，由应用层读取时判断）
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
  // Electron IPC 不需要 TTL（持久存储），传一个很大的 TTL
  await storageSet(KEY_LRU, list.slice(0, PLAYBACK_CACHE_MAX), 365 * 24 * 60 * 60 * 1000);
}

/** 把 songId 移到 LRU 头部，超限时淘汰末尾并返回被淘汰的 ID */
async function touchLru(songId: number): Promise<number | null> {
  let list = await readLru();

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
```

- [ ] **Step 2: Commit**

```bash
git add lib/cache/playbackCache.ts
git commit -m "refactor(playback-cache): IndexedDB + Electron IPC dual backend with LRU"
```

---

### Task 3: Update `store/module/player.tsx` to await cache calls

**Files:**

- Modify: `store/module/player.tsx`

**Dependencies:** Task 2 (cache functions now return Promises)

**Interfaces:**

- Consumes: `getCachedPlayUrl(songId, quality) => Promise<string | null>`, `getCachedLyric(songId) => Promise<NeteaseLyric | null>`, `setCachedPlayUrl(songId, quality, url) => Promise<void>`, `setCachedLyric(songId, lyric) => Promise<void>`

- [ ] **Step 1: Update `playTrack` — add `await` to all cache calls**

The `playTrack` method already uses `async/await`. We just need to prefix the 4 cache calls with `await`.

Find the cache section (around line 264 in the current file):

```ts
// ── 1. Try cache ────────────────────────────────────────────────
const cachedUrl = getCachedPlayUrl(song.id, musicQuality);
const cachedLyric = getCachedLyric(song.id);
```

Change to:

```ts
// ── 1. Try cache ────────────────────────────────────────────────
const [cachedUrl, cachedLyric] = await Promise.all([
  getCachedPlayUrl(song.id, musicQuality),
  getCachedLyric(song.id),
]);
```

And the two `setCached*` calls in the cache-miss branch:

```ts
// 写入缓存
setCachedPlayUrl(song.id, musicQuality, url);
const lyricData2 = lyricRes.data;
if (lyricData2) setCachedLyric(song.id, lyricData2);
```

Change to:

```ts
// 写入缓存
await Promise.all([
  setCachedPlayUrl(song.id, musicQuality, url),
  lyricRes.data ? setCachedLyric(song.id, lyricRes.data) : Promise.resolve(),
]);
const lyricData2 = lyricRes.data;
```

Also in the "URL hit, lyric miss" branch:

```ts
if (lyricData) setCachedLyric(song.id, lyricData);
```

Change to:

```ts
if (lyricData) await setCachedLyric(song.id, lyricData);
```

- [ ] **Step 2: Verify the diff compiles**

Run: `npx -p typescript tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors from `store/module/player.tsx` or `lib/cache/playbackCache.ts`.

- [ ] **Step 3: Commit**

```bash
git add store/module/player.tsx
git commit -m "refactor(player): await async playback cache calls"
```

---

### Task 4: Add i18n translation keys

**Files:**

- Modify: `lib/i18n.ts`

- [ ] **Step 1: Find the `settings.cache` block in the zh-CN section and add playback cache keys**

In `lib/i18n.ts`, the zh-CN section starts around line 1. After the line:

```
"settings.cache.clearFailed": "清理缓存失败",
```

(around line 157), add:

```ts
  "settings.playbackCache.section": "播放缓存",
  "settings.playbackCache.count": "已缓存歌曲",
  "settings.playbackCache.countValue": "{count} 首",
  "settings.playbackCache.clearButton": "清除缓存",
  "settings.playbackCache.clearing": "清除中...",
  "settings.playbackCache.clearSuccess": "播放缓存已清除",
  "settings.playbackCache.clearFailed": "清除播放缓存失败",
```

- [ ] **Step 2: Add zh-TW keys**

Find the zh-TW section (starts around line 632, after the `settings.cache.clearFailed` at line 648). Add:

```ts
  "settings.playbackCache.section": "播放快取",
  "settings.playbackCache.count": "已快取歌曲",
  "settings.playbackCache.countValue": "{count} 首",
  "settings.playbackCache.clearButton": "清除快取",
  "settings.playbackCache.clearing": "清除中...",
  "settings.playbackCache.clearSuccess": "播放快取已清除",
  "settings.playbackCache.clearFailed": "清除播放快取失敗",
```

- [ ] **Step 3: Add en keys**

Find the en section (starts around line 1129, after the `settings.cache.clearFailed` at line 1148). Add:

```ts
  "settings.playbackCache.section": "Playback Cache",
  "settings.playbackCache.count": "Cached Songs",
  "settings.playbackCache.countValue": "{count} songs",
  "settings.playbackCache.clearButton": "Clear Cache",
  "settings.playbackCache.clearing": "Clearing...",
  "settings.playbackCache.clearSuccess": "Playback cache cleared",
  "settings.playbackCache.clearFailed": "Failed to clear playback cache",
```

- [ ] **Step 4: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat(i18n): add playback cache translation keys (zh-CN/zh-TW/en)"
```

---

### Task 5: Add playback cache section to settings page

**Files:**

- Modify: `components/settings/SettingsPage.tsx`
- Modify: `hooks/settings/useSettingsState.ts`

**Dependencies:** Task 2 (cache functions), Task 4 (i18n keys)

- [ ] **Step 1: Add cache management handlers to `useSettingsState.ts`**

Add these imports at the top:

```ts
import { getPlaybackCacheStats, clearPlaybackCache } from "@/lib/cache/playbackCache";
```

Add these state variables inside the `useSettingsState` function body, after the existing `isClearingCache` state:

```ts
const [isClearingPlaybackCache, setIsClearingPlaybackCache] = useState(false);
const [playbackCacheStats, setPlaybackCacheStats] = useState<{
  entryCount: number;
  cacheDir: string | null;
} | null>(null);
```

Add a `useEffect` to load stats on mount, after the existing `useEffect` that loads config:

```ts
// 加载播放缓存统计
useEffect(() => {
  getPlaybackCacheStats()
    .then(setPlaybackCacheStats)
    .catch(() => {});
}, []);
```

Add the clear handler after the existing `handleClearCache` function:

```ts
const handleClearPlaybackCache = async () => {
  if (!config) return;

  setIsClearingPlaybackCache(true);
  try {
    const result = await clearPlaybackCache();
    setPlaybackCacheStats({ entryCount: 0, cacheDir: playbackCacheStats?.cacheDir ?? null });
    toast.success(translate(config.app.locale, "settings.playbackCache.clearSuccess"));
  } catch (error) {
    console.error("[Settings] failed to clear playback cache:", error);
    toast.error(translate(config.app.locale, "settings.playbackCache.clearFailed"));
  } finally {
    setIsClearingPlaybackCache(false);
  }
};
```

Add the new return values at the bottom (in the `return { ... }` object):

```ts
    isClearingPlaybackCache,
    playbackCacheStats,
    handleClearPlaybackCache,
```

- [ ] **Step 2: Add the playback cache section to `SettingsPage.tsx`**

Add to the destructured return values (at the top of the SettingsPage component):

```tsx
const {
  // ... existing destructuring ...
  isClearingPlaybackCache,
  playbackCacheStats,
  handleClearPlaybackCache,
} = useSettingsState();
```

Add the playback cache section. The best placement is right after the existing `SettingSection title={t("settings.section.cache")}>` block closes (around line 371). Add this:

```tsx
{
  /* 播放缓存（Web + Electron 通用） */
}
<SettingSection title={t("settings.playbackCache.section")}>
  <SettingRow
    label={t("settings.playbackCache.count")}
    sublabel={IS_ELECTRON && playbackCacheStats?.cacheDir ? playbackCacheStats.cacheDir : undefined}
    control={
      <span className="text-sm font-medium text-white">
        {playbackCacheStats != null
          ? t("settings.playbackCache.countValue", {
              count: playbackCacheStats.entryCount,
            })
          : "-"}
      </span>
    }
  />
  <SettingRow
    label={t("settings.playbackCache.clearButton")}
    control={
      <button
        type="button"
        onClick={handleClearPlaybackCache}
        disabled={isClearingPlaybackCache}
        className="rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
      >
        {isClearingPlaybackCache
          ? t("settings.playbackCache.clearing")
          : t("settings.playbackCache.clearButton")}
      </button>
    }
  />
</SettingSection>;
```

- [ ] **Step 3: Commit**

```bash
git add components/settings/SettingsPage.tsx hooks/settings/useSettingsState.ts
git commit -m "feat(settings): add playback cache management section"
```

---

### Task 6: Build verification and type check

**Files:**

- The `types/i18n.generated.d.ts` file may need updating if the project has an i18n type generation step.

- [ ] **Step 1: Check if i18n types need regeneration**

```bash
grep -n "playbackCache" types/i18n.generated.d.ts 2>/dev/null
```

If it returns a list of the new keys, types are auto-detected. If not, or if the file doesn't exist, check if there's a generation script in `package.json`:

```bash
grep "i18n" package.json
```

If there's a generation script, run it:

```bash
bun run generate-i18n-types  # or whatever the script name is
```

If there's no generation script and the file has hardcoded types, manually add the new keys in the correct format:

```ts
// types/i18n.generated.d.ts (if it exists and needs manual update)
"settings.playbackCache.section": string;
"settings.playbackCache.count": string;
"settings.playbackCache.countValue": string | { count: number };
"settings.playbackCache.clearButton": string;
"settings.playbackCache.clearing": string;
"settings.playbackCache.clearSuccess": string;
"settings.playbackCache.clearFailed": string;
```

- [ ] **Step 2: Full compilation check**

```bash
npx -p typescript tsc --noEmit --pretty 2>&1 | head -30
```

Expected: 0 errors from our files (existing test error in `tests/pageCache.test.ts` is pre-existing and unrelated).

- [ ] **Step 3: Final commit if types file was updated**

```bash
git add types/i18n.generated.d.ts  # if it was changed
git commit -m "chore: update i18n generated types for playback cache keys"
```

---

## Verification

1. **Web**: `bun run dev` → open Network tab → play a song → note the first play makes API calls → play the same song again → verify NO `song/url` API call (cache hit) → open Application > IndexedDB > scopify-playback-cache → verify entry exists
2. **Electron**: `bun run electron:dev` → play a song → check configured cache directory → verify `.json` files are created
3. **LRU eviction**: Play 101 different songs → verify the first song's cache is evicted
4. **Settings**: Open Settings → see "Playback Cache" section → see song count → click Clear → verify cache is emptied
5. **TTL**: After 30+ minutes, verify cached URL is re-fetched
6. **No regressions**: Progress bar still shows persisted position after refresh

## File Summary

| File                                   | Action                   | Task |
| -------------------------------------- | ------------------------ | ---- |
| `package.json`                         | Modify (add dep)         | 1    |
| `lib/cache/playbackCache.ts`           | **Rewrite**              | 2    |
| `store/module/player.tsx`              | Edit (await cache calls) | 3    |
| `lib/i18n.ts`                          | Edit (add keys)          | 4    |
| `hooks/settings/useSettingsState.ts`   | Edit (add handlers)      | 5    |
| `components/settings/SettingsPage.tsx` | Edit (add UI)            | 5    |
| `types/i18n.generated.d.ts`            | Maybe edit (types)       | 6    |
