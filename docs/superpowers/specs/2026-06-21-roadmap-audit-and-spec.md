# Scopify Roadmap Audit And Spec

**Date:** 2026-06-21

**Goal:** Audit the current TODO list, mark what is already done, and define stricter specs for the remaining work.

**Scope:** This document is the product/spec source of truth. It does not change runtime code directly.

---

## New Engineering Rules

1. Existing `any` debt is acknowledged but not part of this roadmap execution.
2. New code must not introduce `any`. Define domain types first, then implement API wrappers, hooks, stores, and components.
3. Types must be classified by responsibility:
   - `types/api/*.ts`: raw backend response types and normalized API DTOs.
   - `types/components/*.ts`: component props and UI-only view models.
   - `types/<domain>.ts`: shared domain models such as artist, album, playlist, profile.
   - Hook return types live beside the hook only when private; exported hook contracts go into `types/<domain>.ts`.
4. Login-required behavior must reuse the login surface instead of only showing a toast. The user should understand which feature requires login and can go directly to login.
5. Offline/network failure UX must never leave a major page fully blank. Keep the page structure visible with skeleton placeholders, show a toast/banner, and provide refresh/retry actions.

---

## API Notes From NeteaseCloudMusicApi Enhanced

Source: `backend/api-enhanced/public/docs/home.md` and `backend/api-enhanced/interface.d.ts`.

- Update playlist metadata: `/playlist/update`
  - Required params include `id`, `name`, `desc`, `tags`.
  - `tags` uses official playlist tags and multiple tags are separated by `;`.
- Update only playlist tags: `/playlist/tags/update`
  - Params: `id`, `tags`.
- Fetch official high-quality playlist tags: `/playlist/highquality/tags`.
- The interface definition exposes `playlist_highquality_tags(params)` and `playlist_tags_update({ id, tags })`.

Implementation decision: playlist tag UI must fetch official tags first and cache them. Do not ship a fixed local tag list as the source of truth.

---

## Audit Summary

| TODO | Current status | Evidence | Next action |
| --- | --- | --- | --- |
| 侧边栏中多添加一个作者相关的功能区 | Not done | `components/Sidebar.tsx` only has created/subscribed playlist groups. | Add followed artist API/store/sidebar group. |
| 收藏 / 取消收藏专辑 | Not done | `lib/api/album.ts` lacks `/album/sub`; album page has no subscribe action. | Add album subscribe API and UI. |
| 本地打包后端一起导致特别大，后期编译一个二进制文件 | Partially done | `package.json` excludes `backend/api-enhanced`; prior backend decoupling plan exists. | Continue existing backend delivery plan separately. |
| 使用过多的 `any` | Existing debt accepted | Existing hits remain in album, lyrics, queue, profile, API prune code. | Enforce no new `any`; define types before new features. |
| 拉取 GitHub release 自动更新客户端版本 | Partially done | `main/module/updater.ts`, `main/preload.ts`, `types/electron.d.ts` expose updater IPC; Settings UI is missing. | Add updater UI in settings. |
| 编辑歌单 Tag 选择 | Partially done | `PlaylistFormData.tags` exists but UI/API wiring is absent. API docs confirm `/playlist/update`, `/playlist/tags/update`, `/playlist/highquality/tags`. | Fetch official tags, select up to 3, submit `;`-joined tags. |
| 用户个人信息编辑 | Not done | Profile page displays data; update API/UI not wired. | Add login-gated edit profile dialog/page. |
| 按照日期展示每日推荐 | Done | `usePlaylistData` uses `createPageCacheKey("daily", [YYYY-MM-DD])`. | Keep as-is; add regression check later. |
| 点击歌手名字跳转到歌手页面 | Partially done | `TrackRow` supports it; search row and artist popular tracks are text-only. | Create shared artist link component. |
| 播放 web 快捷键适配 | Not done | No global Web playback shortcut hook. | Add keyboard hook with input-field guard. |
| 歌手页面全部歌曲折叠展示 | Partially done | Artist data fetches up to 20 top songs but UI has no expand/collapse. | Add collapsed/expanded popular songs. |
| 无联网导致请求失败，刷新按钮提示用户 | Partially done but insufficient | Sidebar has local retry; major pages can be empty and only toast. | Build skeleton-preserving network failure UX. |
| 封面的播放接口没有效果 | Not done | Cover play is scattered; `ActionStation` comment notes unfinished behavior. | Add shared cover play action. |
| 当前歌曲播放失败自动切下一首 | Not done | `playTrack` failure only toasts; `AudioManager` play failure only stops. | Add fallback counter and auto-next behavior. |

---

## Product Specs

### 1. Network Failure And Empty Page UX

When a request fails because the user is offline, the backend is unreachable, or the request times out, the page must preserve its layout instead of going blank.

Design requirements:
- Keep skeleton cards/rows visible in the failed region, similar to the reference screenshot: content structure remains visible, but data slots are muted placeholders.
- Show a toast or floating banner: "当前网络异常，请检查网络连接".
- Provide primary action "刷新" or "网络诊断" depending on context.
- Keep existing cached data visible when available, and mark the section as stale rather than clearing it.
- Do not classify business API errors as offline errors.

Acceptance:
- `navigator.onLine === false`, axios `ERR_NETWORK`, `ECONNABORTED`, and errors without `response` use retry UI.
- Home, playlist, album, artist, search, comments, and sidebar do not render a fully empty content area on network failure.
- Toast appears once per failure burst, not once per failed request in a fan-out.

### 2. Login-Required Feature Reuse

Operations requiring login must use a reusable login-required component or action. A bare toast is not enough.

Design requirements:
- Create a shared login prompt surface with title, feature-specific description, and login button.
- In Electron, the login button uses `window.electronAPI.openLoginWindow()`.
- In Web, the login button routes to `/login?redirect=<current-url>&reason=<feature>`.
- The login page reads `reason` and displays contextual copy such as "登录后即可收藏专辑" or "登录后即可编辑个人资料".

Acceptance:
- Album collect, playlist edit, profile edit, comments, add-to-playlist, sidebar library, and followed artists use the shared login-required flow.
- After successful Web login, user returns to the original redirect when present.

### 3. Type Gate For New Work

Every new feature in this roadmap starts with types.

Acceptance:
- No new `any`, `Record<string, any>`, or `as any` in touched/new files.
- If a backend response is uncertain, use `unknown` at the boundary plus a normalization function.
- Types are placed in the appropriate `types/api`, `types/components`, or shared domain file before implementation.

### 4. Playlist Tag Selection

The playlist edit dialog fetches official tags from `/playlist/highquality/tags`, lets users select up to 3, and submits tags as a `;`-joined string through `/playlist/update` or `/playlist/tags/update`.

Acceptance:
- Tags load with skeleton/chips placeholder.
- Tag fetch failure does not block editing name/description/cover; it shows retry.
- Existing playlist tags are preselected.
- Save payload uses official tag names and `;` separator.

### 5. Album Subscribe / Unsubscribe

Album pages expose collect/uncollect. If the user is not logged in, the shared login prompt is shown. If logged in, the operation calls `/album/sub`, updates local collected album state, and refreshes affected cache.

Acceptance:
- Button state reflects collected status.
- Operation is optimistic but rolls back on API failure.
- Home "你的收藏专辑" updates after success.

### 6. Sidebar Author Area

Logged-in users see a followed artists section in the sidebar. Artist loading is independent from playlist loading, and failures do not break the library list.

Acceptance:
- Wide sidebar shows avatar/name/subtitle.
- Narrow sidebar shows avatar/icon only.
- Click navigates to `/artist?id=<id>`.

### 7. Artist Links Everywhere

All song rows that show artist names use a shared `ArtistInlineLinks` component.

Acceptance:
- Artists with IDs navigate.
- Artists without IDs render plain text.
- Clicking does not trigger row playback.

### 8. Cover Play Actions

All cover play buttons use a shared action hook. The hook resolves playlist/album/daily tracks, sets the queue, and starts playback.

Acceptance:
- Cover play buttons do not also navigate.
- Empty resources show a clear toast.
- Loading state is scoped to the clicked cover.

### 9. Playback Failure Fallback

If the current song fails to resolve or fails to play, try the next track. If the next track also fails, stop and show a network quality warning.

Acceptance:
- Manual new song selection resets failure count.
- One automatic retry is attempted.
- Two consecutive failures show only one warning.

### 10. Desktop Update UI

Settings page shows current version, update status, check/download/install actions, and progress using existing Electron updater IPC.

Acceptance:
- Hidden in Web runtime.
- Handles `checking`, `available`, `downloading`, `downloaded`, `not-available`, and `error`.

### 11. User Profile Editing

Own profile page shows an edit entry. Editing is login-gated and typed.

Acceptance:
- Only current user's profile shows edit.
- Invalid nickname/birthday/avatar is blocked client-side.
- Failed save keeps user input.

### 12. Web Playback Shortcuts

Add global Web/Electron playback shortcuts while respecting text inputs.

Acceptance:
- Space toggles play/pause.
- Arrow/J/L seek.
- Shift+Arrow switches track.
- M toggles mute.
- No shortcut fires inside input, textarea, select, or contenteditable.

