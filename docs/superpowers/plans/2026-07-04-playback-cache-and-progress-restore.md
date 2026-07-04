# Playback Cache & Progress Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add playback URL/lyric caching and fix progress bar not restoring position after page refresh.

**Architecture:** (1) A lightweight localStorage cache layer (`playbackCache.ts`) for URL and lyric data, (2) fixes to the existing audio lifecycle in `MainLayout.tsx` and `ProgressBar.tsx` to ensure persisted progress is displayed without requiring a play click.

**Tech Stack:** Zustand persist, localStorage, HTML5 `<audio>`, custom events (`player-time`)

## Global Constraints

- localStorage TTL: URL 30 min, lyrics 24 h
- Cache key format: `playback-cache:url:{songId}:{quality}` and `playback-cache:lyric:{songId}`
- No application-level caching of audio binary data (rely on browser HTTP cache)
- `handleQualityChange` must delegate to `playTrack` and not make independent API calls
- No platform branching (Electron/Web share same code path)
- All changes must be compatible with both Web and Electron (Chromium) environments

---

### Task 1: Create `lib/cache/playbackCache.ts`

**Files:**

- Create: `lib/cache/playbackCache.ts`

**Interfaces:**

- Produces: `getCachedPlayUrl(songId, quality) => string | null`, `setCachedPlayUrl(…)`, `getCachedLyric(songId) => NeteaseLyric | null`, `setCachedLyric(…)`, `clearPlaybackCache(songId?)`

- [ ] **Step 1: Create playbackCache.ts**

```ts
// lib/cache/playbackCache.ts
// ── Playback Data Cache ────────────────────────────────────────────────────────
// 缓存歌曲播放 URL 和歌词，减少 API 重复请求。
// URL 缓存 30 分钟（网易云 URL 有有效期），歌词缓存 24 小时。

import type { NeteaseLyric } from "@/types/api/music";
import type { MusicQuality } from "@/store/module/player";

const CACHE_PREFIX_URL = "playback-cache:url";
const CACHE_PREFIX_LYRIC = "playback-cache:lyric";
const URL_TTL_MS = 30 * 60 * 1000; // 30 分钟
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
  const prefix = songId != null ? [CACHE_PREFIX_URL, CACHE_PREFIX_LYRIC] : null; // null = all

  Object.keys(localStorage)
    .filter((key) => {
      if (prefix) {
        return prefix.some((p) => key.startsWith(p + ":" + songId));
      }
      return key.startsWith(CACHE_PREFIX_URL) || key.startsWith(CACHE_PREFIX_LYRIC);
    })
    .forEach((key) => localStorage.removeItem(key));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/cache/playbackCache.ts
git commit -m "feat(playback-cache): add localStorage cache layer for song URLs and lyrics"
```

---

### Task 2: Fix `onCanPlay` in `MainLayout.tsx` — dispatch `player-time` event

**Files:**

- Modify: `components/MainLayout.tsx` — inside the `onCanPlay` prop of `<audio>`

**Dependencies:** None

**Rationale:** After restoring `audio.currentTime` from persisted time, the progress bar has no way to know about it because `onTimeUpdate` skips paused state (`if (audio.paused) return`). Dispatching a `player-time` CustomEvent bridges this gap.

- [ ] **Step 1: Edit `onCanPlay` in `MainLayout.tsx`**

Find the `onCanPlay={(e) => {` block (around line 293) and add a `window.dispatchEvent(...)` after the seek logic:

```tsx
          onCanPlay={(e) => {
            const audio = e.currentTarget;

            // 如果这首歌还没恢复过进度，则进行跳转
            if (!hasRestoredProgressRef.current) {
              const persistedTime = useTimeStore.getState().currentTime;

              if (persistedTime > 0) {
                const restoreSeconds = persistedTime / 1000;
                if (Number.isFinite(audio.duration) && audio.duration > 0) {
                  audio.currentTime = Math.min(restoreSeconds, audio.duration - 1);
                } else {
                  audio.currentTime = restoreSeconds;
                }

                // 🔁 广播恢复后的进度给 ProgressBar（无需等用户点播放）
                window.dispatchEvent(new CustomEvent("player-time", { detail: persistedTime }));
              } else {
                // 如果 persistedTime 为 0，说明是切歌，强制 currentTime 归零并写入 store
                audio.currentTime = 0;
                useTimeStore.getState().setCurrentTime(0);
                window.dispatchEvent(new CustomEvent("player-time", { detail: 0 }));
              }
              // 恢复完毕，拉上保险栓，防止后续因为网络缓冲等原因重复触发
              hasRestoredProgressRef.current = true;
            }

            if (isPlaying) audio.play().catch(console.error);
          }}
```

The key additions are the two `window.dispatchEvent(new CustomEvent("player-time", …))` calls — one inside the `if (persistedTime > 0)` branch and one inside the `else` branch.

- [ ] **Step 2: Commit**

```bash
git add components/MainLayout.tsx
git commit -m "fix(playbar): dispatch player-time event from onCanPlay after restoring progress"
```

---

### Task 3: Fix `ProgressBar.tsx` initial value — read persisted time directly from localStorage

**Files:**

- Modify: `components/PlayBar/ProgressBar.tsx`

**Dependencies:** None

**Rationale:** Zustand persist hydrates asynchronously. On mount, `useTimeStore.getState().currentTime` is `0` because the persisted value hasn't been applied yet. Reading directly from localStorage in the `useState` lazy initializer bypasses this window.

- [ ] **Step 1: Edit `ProgressBar.tsx` — change `useState` initializer**

Replace:

```tsx
const [localTime, setLocalTime] = useState(0);
```

With a lazy initializer that reads from localStorage directly:

```tsx
const [localTime, setLocalTime] = useState(() => {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("player-time-storage");
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return parsed.state?.currentTime ?? 0;
  } catch {
    return 0;
  }
});
```

- [ ] **Step 2: Edit `ProgressBar.tsx` — subscribe to store `currentTime` for hydration sync**

Add a subscription to `useTimeStore((s) => s.currentTime)` that syncs to local state exactly once (on hydration completion).

Add this import if not already present:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
```

Keep the existing imports — just ensure `useCallback` is not needed (we won't add it). The existing imports already include `useEffect, useRef, useState`.

Add this block inside the `useEffect` (before the `player-time` listener registration), or even better, use a separate `useEffect`:

```tsx
// ── Hydration sync: Zustand persist 异步水合完成后同步一次到 local state ──
const storeCurrentTime = useTimeStore((s) => s.currentTime);
const hydrationSyncedRef = useRef(false);

useEffect(() => {
  // 只在首次水合完成且 localTime 仍为 0 时同步
  if (!hydrationSyncedRef.current && storeCurrentTime > 0 && localTime === 0) {
    setLocalTime(storeCurrentTime);
    hydrationSyncedRef.current = true;
  }
}, [storeCurrentTime]); // eslint-disable-line react-hooks/exhaustive-deps
```

Wait — `localTime` is a state variable in the same component, but the `useEffect` above would need it in the dependency array. This creates a circular issue. A simpler approach: create the `hydrationSyncedRef` and only trigger on the store value, checking localTime via the ref isn't necessary since we guard with `!hydrationSyncedRef.current`.

Actually the simplest correct approach:

```tsx
const storeCurrentTime = useTimeStore((s) => s.currentTime);
const hydrationSyncedRef = useRef(false);

useEffect(() => {
  if (!hydrationSyncedRef.current && storeCurrentTime > 0) {
    setLocalTime(storeCurrentTime);
    hydrationSyncedRef.current = true;
  }
}, [storeCurrentTime]);
```

This subscribes to `storeCurrentTime`. When Zustand finishes hydration and the store updates from `0` to the persisted value, this effect fires and syncs it to `localTime`. After that, the ref prevents further syncs (so the 3-second store writes during playback don't override the live progress).

- [ ] **Step 3: Commit**

```bash
git add components/PlayBar/ProgressBar.tsx
git commit -m "fix(playbar): init progress from localStorage directly, subscribe to hydration sync"
```

---

### Task 4: Integrate playback cache into `playTrack`

**Files:**

- Modify: `store/module/player.tsx`

**Dependencies:** Task 1 (playbackCache.ts must exist)

- [ ] **Step 1: Add import at top of `store/module/player.tsx`**

```ts
import {
  getCachedPlayUrl,
  getCachedLyric,
  setCachedPlayUrl,
  setCachedLyric,
} from "@/lib/cache/playbackCache";
```

- [ ] **Step 2: Refactor `playTrack` to use cache**

Replace the existing `playTrack` implementation (lines ~242-283) with this version:

```tsx
      playTrack: async (song, options = {}) => {
        const shouldResetFailureCount = options.resetFailureCount ?? true;
        useTimeStore.getState().setCurrentTime(0);
        useTimeStore.getState().setBufferedTime(0);
        set({
          currentSongDetail: song,
          currentSongUrl: null,
          isPlaying: false,
          ...(shouldResetFailureCount ? { playbackFailureCount: 0 } : {}),
        });

        void enrichSongStatsById(song.id, {
          likedCount: song.likedCount,
          commentCount: song.commentCount,
        });

        try {
          const { musicQuality } = get();
          const level = UI_QUALITY_TO_LEVEL[musicQuality] || "exhigh";

          // ── 1. Try cache ────────────────────────────────────────────────
          const cachedUrl = getCachedPlayUrl(song.id, musicQuality);
          const cachedLyric = getCachedLyric(song.id);

          if (cachedUrl) {
            // URL 缓存命中
            if (cachedLyric) {
              // 歌词也命中 → 完全短路
              useTimeStore.getState().setTotalTime(song.dt ?? 0);
              set({
                currentSongUrl: cachedUrl,
                isPlaying: true,
                lyric: cachedLyric,
                playbackFailureCount: 0,
              });
              return;
            }
            // 仅 URL 命中 → 设置 URL，只请求歌词
            set({ currentSongUrl: cachedUrl });
            const lyricRes = await getLyric(song.id);
            const lyricData = lyricRes.data;
            if (lyricData) setCachedLyric(song.id, lyricData);
            useTimeStore.getState().setTotalTime(song.dt ?? 0);
            set({
              isPlaying: true,
              lyric: lyricData ?? null,
              playbackFailureCount: 0,
            });
            return;
          }

          // ── 2. Cache miss → fetch both ─────────────────────────────────
          const [urlRes, lyricRes] = await Promise.all([
            getSongUrlWithQuality(song.id, level),
            getLyric(song.id),
          ]);
          const url = urlRes.data;

          if (!url) {
            throw new Error("Playback URL is empty");
          }

          // 写入缓存
          setCachedPlayUrl(song.id, musicQuality, url);
          const lyricData = lyricRes.data;
          if (lyricData) setCachedLyric(song.id, lyricData);

          useTimeStore.getState().setTotalTime(song.dt ?? 0);
          set({
            currentSongUrl: url,
            isPlaying: true,
            lyric: lyricData ?? null,
            playbackFailureCount: 0,
          });
        } catch (e) {
          console.error("获取歌曲播放地址或歌词失败", e);
          await get().handlePlaybackFailure("url");
        }
      },
```

- [ ] **Step 3: Commit**

```bash
git add store/module/player.tsx
git commit -m "feat(playback-cache): integrate URL and lyric cache into playTrack"
```

---

### Task 5: Simplify `handleQualityChange` in `PlayerBar.tsx`

**Files:**

- Modify: `components/PlayerBar.tsx`

**Dependencies:** Task 4 (playTrack must handle cache so quality switch benefits from caching)

**Rationale:** Quality switching previously made its own `getSongUrlWithQuality` call outside the cache layer. By delegating to `playTrack`, we automatically get cache benefits: if the same song was already cached at this quality, no API call is made.

- [ ] **Step 1: Edit `handleQualityChange` in `PlayerBar.tsx`**

Replace the existing `handleQualityChange` function (around lines 189-208):

```tsx
const handleQualityChange = async (quality: any) => {
  if (musicQuality === quality) return; // 同品质跳过
  setMusicQuality(quality);
  if (currentSong?.id) {
    // 委托 playTrack 走缓存逻辑
    await usePlayerStore.getState().playTrack(currentSong);
  }
};
```

Also remove the unused imports if they become dead:

- `getSongUrlWithQuality` from `@/lib/api/music` — check if it's still used elsewhere in the file (line 32). It might only be used in `handleQualityChange`. If so, remove it from the import.
- `UI_QUALITY_TO_LEVEL` from `@/lib/api/music` — same check.

Check usage: search the file for `getSongUrlWithQuality` and `UI_QUALITY_TO_LEVEL`.

- [ ] **Step 2: Clean up unused imports (if applicable)**

If `getSongUrlWithQuality` and `UI_QUALITY_TO_LEVEL` are no longer referenced after removing `handleQualityChange`'s body:

Update line 32:

```tsx
// Before:
import { getSongUrlWithQuality, UI_QUALITY_TO_LEVEL } from "@/lib/api/music";
// After:
import { getSongUrlWithQuality, UI_QUALITY_TO_LEVEL } from "@/lib/api/music";
```

If they're used elsewhere in `PlayerBar.tsx`, leave the imports as-is.

- [ ] **Step 3: Commit**

```bash
git add components/PlayerBar.tsx
git commit -m "refactor(playbar): delegate quality switch to playTrack for cache reuse"
```

---

## Verification

After all tasks are done, run the app and test:

1. **Web**: `bun run dev` → play a song → note the position → refresh page → verify progress bar shows the correct position without clicking play
2. **URL cache**: Play song A, then song B, then song A again. Verify `getSongUrlWithQuality` is only called twice (first time for A and B, not for A again) — check DevTools Network tab
3. **Lyric cache**: Same pattern — verify no duplicate lyric requests for repeated songs
4. **Quality switch**: Switch quality on a playing song → verify it works and shows correct URL quality
5. **Same-quality skip**: Click the same quality again → verify no API call is made (`if (musicQuality === quality) return`)
6. **Electron**: Same tests via `bun run electron:dev`

## File Summary

| File                                 | Action                                | Task |
| ------------------------------------ | ------------------------------------- | ---- |
| `lib/cache/playbackCache.ts`         | **Create**                            | 1    |
| `components/MainLayout.tsx`          | Edit: onCanPlay dispatch              | 2    |
| `components/PlayBar/ProgressBar.tsx` | Edit: useState init + hydration sync  | 3    |
| `store/module/player.tsx`            | Edit: playTrack cache integration     | 4    |
| `components/PlayerBar.tsx`           | Edit: handleQualityChange → playTrack | 5    |
