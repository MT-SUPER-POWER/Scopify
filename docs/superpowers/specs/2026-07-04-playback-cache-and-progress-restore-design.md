# Playback Cache & Progress Restore Design

**Date**: 2026-07-04
**Scope**: 播放数据缓存层 + 播放进度恢复修复

---

## 1. Problem

### 1.1 进度条刷新后不显示记忆位置

- **水合时序问题**：Zustand `persist` 异步水合，ProgressBar mount 时 `useTimeStore.getState().currentTime` 为 `0`，`if (persisted > 0)` 跳过恢复
- **通知缺失**：`MainLayout.tsx` 的 `<audio onCanPlay>` 恢复了 `audio.currentTime` 但未 dispatch `player-time` 事件；而 `onTimeUpdate` 在暂停态（`if (audio.paused) return`）不触发，进度条无法感知
- **结果**：刷新后播放 UI 显示 `0:00`，用户点播放才跳转

### 1.2 播放数据无缓存

- `playTrack` 每次调用都请求 `getSongUrlWithQuality()` 和 `getLyric()`，同首歌反复回放/切回也重新请求
- 音质切换 (`handleQualityChange`) 也独立调用 `getSongUrlWithQuality`，不经过缓存层

---

## 2. Design

### 2.1 Module 1: ProgressBar Progress Restore

**Files modified**: `components/PlayBar/ProgressBar.tsx`, `components/MainLayout.tsx`

#### 2.1.1 ProgressBar 初始值（`ProgressBar.tsx`）

当前 `useState(0)` + `useEffect` 读取 store，改为 lazy initializer 直接从 localStorage 解析：

```ts
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

并订阅 `useTimeStore((s) => s.currentTime)`，第一次非零更新时同步到 `localTime`（只用一次，之后靠 `player-time` 事件驱动）。

#### 2.1.2 onCanPlay 修复（`MainLayout.tsx`）

在 `onCanPlay` 的 `if (!hasRestoredProgressRef.current)` 块内，seek 完成后 dispatch `player-time`：

```tsx
onCanPlay={(e) => {
  const audio = e.currentTarget;
  if (!hasRestoredProgressRef.current) {
    const persistedTime = useTimeStore.getState().currentTime;
    if (persistedTime > 0) {
      audio.currentTime = Math.min(persistedTime / 1000, audio.duration - 1);
    } else {
      audio.currentTime = 0;
      useTimeStore.getState().setCurrentTime(0);
    }
    // 🔁 通知 ProgressBar 更新，无需等用户点击播放
    window.dispatchEvent(new CustomEvent('player-time', {
      detail: persistedTime > 0 ? persistedTime : 0,
    }));
    hasRestoredProgressRef.current = true;
  }
  if (isPlaying) audio.play().catch(console.error);
}}
```

### 2.2 Module 2: Playback Cache Layer

**New file**: `lib/cache/playbackCache.ts`

#### 2.2.1 Cache Key 设计

| 数据     | Key 格式                                | TTL    |
| -------- | --------------------------------------- | ------ |
| 播放 URL | `playback-cache:url:{songId}:{quality}` | 30 min |
| 歌词     | `playback-cache:lyric:{songId}`         | 24 h   |

#### 2.2.2 API

```ts
export function getCachedPlayUrl(songId: number, quality: string): string | null;
export function setCachedPlayUrl(songId: number, quality: string, url: string): void;

export function getCachedLyric(songId: number): NeteaseLyric | null;
export function setCachedLyric(songId: number, lyric: NeteaseLyric): void;

export function clearPlaybackCache(songId?: number): void;
// 无参时清空所有播放缓存
```

#### 2.2.3 集成到 `store/module/player.tsx`

`playTrack` 改造为三阶段：

1. Check cache → `getCachedPlayUrl` + `getCachedLyric`
2. If both hit → short-circuit, no API call
3. If miss → fetch API, write cache, then set state

歌词可以单独拆分：如果 URL 命中但歌词未缓存，只请求歌词：

```ts
if (cachedUrl) {
  // URL 命中，直接设置 URL
  set({ currentSongUrl: cachedUrl });
  if (cachedLyric) {
    set({ lyric: cachedLyric, ... });
    return;
  }
  // 只请求歌词
  const lyricRes = await getLyric(song.id);
  setCachedLyric(song.id, lyricRes.data);
  set({ lyric: lyricRes.data, ... });
  return;
}
```

#### 2.2.4 音质切换复用 `playTrack`

`PlayerBar.tsx:handleQualityChange` 简化：

```ts
const handleQualityChange = async (quality: MusicQuality) => {
  if (musicQuality === quality) return; // 同品质跳过
  setMusicQuality(quality);
  if (currentSong?.id) {
    await usePlayerStore.getState().playTrack(currentSong);
  }
};
```

---

## 3. Files Changed

| File                                 | Action                                          |
| ------------------------------------ | ----------------------------------------------- |
| `lib/cache/playbackCache.ts`         | **New** — 播放缓存层                            |
| `components/PlayBar/ProgressBar.tsx` | Edit — 修复初始值 + 水合同步                    |
| `components/MainLayout.tsx`          | Edit — onCanPlay 添加 player-time dispatch      |
| `store/module/player.tsx`            | Edit — playTrack 接入缓存                       |
| `components/PlayerBar.tsx`           | Edit — handleQualityChange 简化为调用 playTrack |

---

## 4. No-Go Areas

- 音频二进制数据（blob/buffer）不做应用层缓存，依靠浏览器 HTTP 缓存
- 缓存满后不清除最长未使用项，仅靠 TTL 过期（数据量小，远不到 localStorage 5MB 上限）
