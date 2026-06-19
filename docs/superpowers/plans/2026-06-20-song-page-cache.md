# Song Page Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent, configurable, clearable caching for song-heavy pages so reopening the app or revisiting pages renders quickly.

**Architecture:** The Electron main process owns the durable file cache and exposes safe IPC methods through preload. Renderer hooks read cached page payloads first, render immediately on hits, then refresh from the network and write fresh cache entries. Cache configuration lives in the existing app config and settings UI.

**Tech Stack:** Electron IPC, Next.js client hooks, Bun tests, TypeScript, YAML app config.

---

### Task 1: Cache Config And Core Store

**Files:**
- Modify: `types/config.ts`
- Modify: `config/app.config.default.yml`
- Modify: `config/app.config.yml`
- Create: `main/module/pageCache.ts`
- Test: `tests/pageCache.test.ts`
- Test: `tests/yaml.test.ts`

- [ ] Write failing tests for config defaults and file cache read/write/expiry/clear.
- [ ] Run `bun test tests/pageCache.test.ts tests/yaml.test.ts` and verify the new tests fail.
- [ ] Add `cache` config normalization and YAML defaults.
- [ ] Implement `createPageCacheStore` with JSON files, TTL metadata, size stats, and clear helpers.
- [ ] Run the focused tests and verify they pass.

### Task 2: IPC And Renderer Cache Client

**Files:**
- Modify: `main/module/ipc.ts`
- Modify: `main/preload.ts`
- Modify: `types/electron.d.ts`
- Create: `lib/cache/pageCache.ts`

- [ ] Add typed IPC methods for `cache:get`, `cache:set`, `cache:delete`, `cache:clear`, and `cache:getStats`.
- [ ] Add renderer helpers that use Electron IPC when available and fall back to `localStorage` for web mode.
- [ ] Ensure cache keys are stable and do not include request timestamps.

### Task 3: Settings UI For Cache Location And Clear

**Files:**
- Modify: `components/settings/SettingsPage.tsx`
- Modify: `hooks/settings/useSettingsState.ts`
- Modify: `lib/i18n.ts`

- [ ] Add settings controls for enabled state, cache directory, TTLs, and max size.
- [ ] Add a clear cache button wired to IPC with success/error toast feedback.
- [ ] Keep custom cache directory changes restart-free.

### Task 4: Page Hook Integration

**Files:**
- Modify: `components/Playlist/hook/usePlaylistData.ts`
- Modify: `components/album/AlbumPage.tsx`
- Modify: `hooks/artist/useArtistData.ts`
- Modify: `hooks/search/useSearchData.ts`

- [ ] Read page cache before fetching and render cached data without skeleton wait.
- [ ] Refresh network data in the background and update cache on success.
- [ ] Use daily cache expiry for daily recommendations and shorter TTL for search.
- [ ] Fix album duplicate fetch by separating fetched album detail from derived cover metadata.

### Task 5: Invalidation And Verification

**Files:**
- Modify targeted action handlers that mutate playlist/song state.

- [ ] Clear related cache keys after playlist edits, track deletion, like toggles, and daily recommendation dislike.
- [ ] Run `bun test tests/pageCache.test.ts tests/yaml.test.ts`.
- [ ] Run `bun run check`.
- [ ] Run `bun run build:web` if lint/type checks pass.
