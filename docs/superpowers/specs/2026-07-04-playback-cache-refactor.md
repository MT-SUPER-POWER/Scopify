# Playback Cache Refactor: IndexedDB + LRU + Configurable Path

**Date**: 2026-07-04
**Scope**: 替换现有 `lib/cache/playbackCache.ts` 的 localStorage 平铺方案，改为 IndexedDB (Web) + 文件存储 (Electron) 双后端，LRU 淘汰，设置页可管理

---

## 1. 现存问题

当前 `playbackCache.ts` 使用 localStorage 平铺存储，有 3 个严重缺陷：

| 问题         | 根因                                                             | 后果                                   |
| ------------ | ---------------------------------------------------------------- | -------------------------------------- |
| **Key 污染** | 每首歌 × 每个音质 + 歌词 = 至少 3 条 key。听 200 首歌 → 600+ key | 调试困难，枚举性能下降                 |
| **僵尸数据** | `expiresAt` 只读不删，localStorage 无自动过期                    | 撑爆 5MB 上限，报 `QuotaExceededError` |
| **同步阻塞** | `JSON.parse`/`stringify` 大段歌词在同步主线程                    | UI 掉帧（布局抖动、动画卡顿）          |

同时，`ProgressBar.tsx` 的 `useState` 直读 localStorage 导致 SSR Hydration Mismatch。

---

## 2. 架构

```
                     playbackCache.ts
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     Electron (IPC)              Web (idb-keyval)
              │                       │
              ▼                       ▼
   main/module/pageCache.ts     IndexedDB
   (文件存储, 路径 = cache.dir)  (scopify-playback-cache DB)
```

### 2.1 双后端设计

|                | Electron                                                            | Web                 |
| -------------- | ------------------------------------------------------------------- | ------------------- |
| **API**        | 复用 `window.electronAPI.getPageCache/setPageCache/deletePageCache` | `idb-keyval` CRUD   |
| **存储介质**   | JSON 文件 (`cache.dir/{sha256}.json`)                               | IndexedDB           |
| **自定义路径** | ✅ 由 `cache.dir` 配置控制                                          | N/A（浏览器不支持） |
| **容量**       | 由 `cache.maxSizeMB` 控制（主进程自动 LRU）                         | 无硬限制（~GB 级）  |

**关键设计决策**：在 Electron 中**复用**现有 `cache:*` IPC 通道，而非创建新通道。因为这些 IPC 是完全通用的键值存储——key `playback-song:123` 会被 hash 为文件名，存在 `cache.dir/` 目录下，与页缓存共用一套文件系统。

优势：

- 无需修改 `main/module/ipc.ts` 和 `main/module/pageCache.ts`
- 自动继承 `cache.dir` 配置（用户可改路径）
- 自动享受主进程的 TTL 过期 + size-based LRU 淘汰

### 2.2 为什么 Web 端用 IndexedDB 而非 localStorage

| 维度              | IndexedDB (`idb-keyval`)    | localStorage                    |
| ----------------- | --------------------------- | ------------------------------- |
| 容量              | ~GB 级                      | 5MB                             |
| API               | 异步（不阻塞主线程）        | 同步（阻塞）                    |
| 数据组织          | 一个数据库，不污染 key 空间 | 所有 key 平铺在同一个 namespace |
| `idb-keyval` 体积 | ~1KB gzipped                | N/A                             |

---

## 3. 数据模型

### 3.1 Key 设计

每首歌**一个 key**（不再按音质、歌词拆分），LRU 列表单独一个 key：

| Key                      | Value            | 说明                              |
| ------------------------ | ---------------- | --------------------------------- |
| `playback-song:{songId}` | `SongCacheEntry` | 单首歌的完整缓存数据              |
| `playback-lru`           | `number[]`       | 最近播放的歌 ID 列表，最多 100 条 |

### 3.2 `SongCacheEntry` 结构

```ts
interface SongCacheEntry {
  url: Partial<Record<MusicQuality, string>>;
  // ^ { high: "https://...", lossless: "https://..." }
  //   可能有音质不完整的情况
  lyric: NeteaseLyric | null;
  cachedAt: number; // Date.now()
}
```

### 3.3 TTL 策略

| 字段            | 写入时更新规则          | 读取时过期规则                                  |
| --------------- | ----------------------- | ----------------------------------------------- |
| `url.{quality}` | 调用 `playTrack` 时写入 | 从缓存读出后，上层判断是否过期（30 分钟软过期） |
| `lyric`         | 调用 `playTrack` 时写入 | 24 小时硬过期                                   |

TTL 在应用层（读取时）判断，而非存储层。因为 Electron 文件存储已有自己的 TTL 机制（`setPageCache` 的 `ttlMs` 参数），而 IndexedDB 没有。

**注意**：Electron 端复用 `electronAPI.setPageCache(key, value, ttlMs)` 时，**也传入** ttlMs，这样主进程文件存储层会自动清理过期文件。这是双保险机制。

---

## 4. LRU 算法

### 4.1 规则

- 最多缓存 **100 首歌**（常量 `PLAYBACK_CACHE_MAX`）
- **每次 `playTrack` 写入缓存时**，将 songId 移到 LRU 列表头部
- 写入后如果列表超过 100，删除末尾的 songId 及其缓存数据

### 4.2 流程

```
playTrack 写入缓存:
  1. 写入/更新 playback-song:{songId}
  2. 读 playback-lru
  3. 将 songId 移到头部（若已存在则删除旧位置）
  4. 若列表长度 > 100，pop 末尾的 staleId
  5. 删除 playback-song:{staleId}
  6. 写回 playback-lru

首次写入（无 LRU 列表）:
  1. 写入 playback-song:{songId}
  2. 创建 playback-lru = [songId]
```

### 4.3 与 Electron 主进程 LRU 的关系

Electron 主进程的 `pruneToSizeLimit` 是基于**文件 mtime + 总大小**的 LRU。我们的应用层 LRU 是基于**歌曲维度**的 LRU。两者互补：

- **主进程 LRU**：当 `cache.dir/` 总文件体积超过 `cache.maxSizeMB` 时，按 mtime 删除最旧文件。这是**存储层**的兜底保护。
- **应用层 LRU**：按歌曲最近播放顺序，淘汰最早听的歌。这是**数据层**的精确定义。

两者不冲突，反而形成双层保护。

---

## 5. 接口定义

### 5.1 导出的函数签名（保持与当前一致，调用方无需修改）

```ts
// —— 当前代码已在用的接口，保持不变 ——

export function getCachedPlayUrl(songId: number, quality: MusicQuality): Promise<string | null>;
// 读取缓存中指定音质的 URL，判断 30 分钟软过期

export function setCachedPlayUrl(songId: number, quality: MusicQuality, url: string): Promise<void>;
// 写入/更新音质 URL + 更新 LRU

export function getCachedLyric(songId: number): Promise<NeteaseLyric | null>;
// 读取缓存中的歌词，判断 24 小时硬过期

export function setCachedLyric(songId: number, lyric: NeteaseLyric): Promise<void>;
// 写入歌词 + 更新 LRU

// —— 新增 ——

export function clearPlaybackCache(): Promise<{ entryCount: number }>;
// 清除所有播放缓存（LRU 列表 + 所有 song 数据）

export function getPlaybackCacheStats(): Promise<{
  entryCount: number;
  cacheDir: string | null;
}>;
// 返回缓存统计（歌曲数 + 存储路径，Web 端 cacheDir 为 null）

export const PLAYBACK_CACHE_MAX = 100;
```

**重要变更**：现有 `clearPlaybackCache(songId?)` 签名改为无参 `clearPlaybackCache()`。检查调用方（当前只有 `useSettingsState.handleClearCache` 中有一处引用，改为新接口即可）。

### 5.2 调用方适配

`store/module/player.tsx` 中 `playTrack` 的调用代码**基本不变**，只调整 `getCachedPlayUrl` 和 `getCachedLyric` 为 `await`：

```ts
// 当前:
const cachedUrl = getCachedPlayUrl(song.id, musicQuality);
if (cachedUrl) { ... }

// 改为:
const cachedUrl = await getCachedPlayUrl(song.id, musicQuality);
if (cachedUrl) { ... }
```

同理 `getCachedLyric` → `await getCachedLyric`，`setCachedPlayUrl` → `await setCachedPlayUrl`

---

## 6. 设置页面

在现有 `components/settings/SettingsPage.tsx` 中，新增一个**Web + Electron 通用**的"播放缓存"面板，放在 `cache` 区下方（现有 `cache` 区是 Electron-only，新增的播放缓存区两端都显示）。

### 6.1 布局位置

```
当前设置页布局:
  ┌─ Application ────────┐   ┌─ Logging (Electron only) ────┐
  │ 语言                  │   │ 日志级别                       │
  │ GPU (Electron)        │   │ 保留天数                       │
  │ DevTools (Electron)   │   └──────────────────────────────┘
  │ 关闭行为 (Electron)   │   ┌─ AppUpdater ─────────────────┐
  ├─ Backend ────────────┤   └──────────────────────────────┘
  │ 后端地址              │   ┌─ Cache (Electron only) ──────┐
  │ 端口                  │   │ 启用  │ 目录  │ 大小  │ TTL   │
  ├─ Network ────────────┤   │ 清理按钮                       │
  │ 超时 / 重试 / 代理    │   └──────────────────────────────┘
  └──────────────────────┘   ┌─ Playback Cache (Web+Electron) ──┐  ← 新增
                             │ 已缓存 N 首歌                     │
                             │ 存储路径: xxx (Electron)          │
                             │ [清除播放缓存]                    │
                             └──────────────────────────────────┘
```

### 6.2 UI 组件

使用现有的 `SettingSection` / `SettingRow` 组件，与页面风格一致：

```tsx
{
  /* 播放缓存（Web + Electron 通用） */
}
<SettingSection title={t("settings.playbackCache.section")}>
  <SettingRow
    label={t("settings.playbackCache.count")}
    sublabel={
      playbackCacheStats
        ? IS_ELECTRON
          ? t("settings.playbackCache.dir", { dir: playbackCacheStats.cacheDir })
          : undefined
        : undefined
    }
    control={
      <span className="text-sm font-medium text-white">
        {playbackCacheStats
          ? t("settings.playbackCache.countValue", { count: playbackCacheStats.entryCount })
          : "-"}
      </span>
    }
  />
  <SettingRow
    label={t("settings.playbackCache.clear")}
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

### 6.3 i18n key 表

| Key                                   | zh-CN            | en                             |
| ------------------------------------- | ---------------- | ------------------------------ |
| `settings.playbackCache.section`      | 播放缓存         | Playback Cache                 |
| `settings.playbackCache.count`        | 已缓存歌曲       | Cached Songs                   |
| `settings.playbackCache.countValue`   | `{count} 首`     | `{count} songs`                |
| `settings.playbackCache.dir`          | 存储路径: {dir}  | Path: {dir}                    |
| `settings.playbackCache.clearButton`  | 清除缓存         | Clear Cache                    |
| `settings.playbackCache.clearing`     | 清除中...        | Clearing...                    |
| `settings.playbackCache.clearSuccess` | 播放缓存已清除   | Playback cache cleared         |
| `settings.playbackCache.clearFailed`  | 清除播放缓存失败 | Failed to clear playback cache |

---

## 7. 依赖

```json
// package.json (新增)
{
  "dependencies": {
    "idb-keyval": "^6.2.1"
  }
}
```

`idb-keyval` 是目前最轻量的 IndexedDB 封装库（~1KB gzipped），提供简洁的 Promise-based key-value 接口。

---

## 8. 文件变更清单

| 文件                                   | 操作     | 说明                               |
| -------------------------------------- | -------- | ---------------------------------- |
| `lib/cache/playbackCache.ts`           | **重写** | IndexedDB + 文件 IPC + LRU         |
| `store/module/player.tsx`              | 修改     | `getCachedPlayUrl` 等改为 await    |
| `components/settings/SettingsPage.tsx` | 修改     | 新增播放缓存面板                   |
| `hooks/settings/useSettingsState.ts`   | 修改     | 新增 `handleClearPlaybackCache`    |
| `lib/i18n.ts`                          | 修改     | 新增 7 组翻译 key (zh-CN/zh-TW/en) |
| `types/i18n.generated.d.ts`            | 自动生成 | 类型重跑                           |
| `package.json`                         | 修改     | 新增 `idb-keyval` 依赖             |
| `lib/cache/pageCache.ts`               | **不改** | 与页缓存无关                       |

---

## 9. 渐进式迁移

当前 localStorage 中可能已有旧的 `playback-cache:url:*` 和 `playback-cache:lyric:*` 数据。首次加载新缓存层时，**不做自动迁移**（不值得为过期数据写迁移逻辑）。旧数据会在 TTL 过期后自然被代码读取不到，或者在浏览器清理 localStorage 时被清除。

清除操作：`clearPlaybackCache()` 清理 IndexedDB + 文件中的播放缓存，不清除 localStorage 中的旧数据。

---

## 10. 边界情况

| 场景                                             | 行为                                                       |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `playTrack` 时缓存 miss                          | 正常请求 API 并写入缓存                                    |
| `playTrack` 时缓存 hit 但 URL 过期（>30 分钟）   | 重新请求 API，覆盖写入                                     |
| `playTrack` 时缓存 hit 但 lyric 过期（>24 小时） | 只请求歌词，保留 URL                                       |
| IndexedDB 不可用（Safari 无痕等）                | `idb-keyval` 会自动 reject，catch 降级为无缓存（正常播放） |
| Electron `cache:get` 返回 null                   | 降级为无缓存，正常请求                                     |
| Electron 缓存文件被手动删除                      | 下次读取返回 null，自动重建                                |
| LRU 重入（同一首歌连续播放 100 次）              | 只占用 1 个 LRU 位置，位置移到头部                         |
