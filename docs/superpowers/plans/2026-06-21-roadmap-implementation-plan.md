# Scopify Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the remaining roadmap with strict typing for new work, reusable login-required UX, official playlist tag APIs, and non-blank network failure states.

**Architecture:** Add types first for each feature. Keep APIs under `lib/api`, shared hooks under `hooks` or `lib/hooks`, reusable UI under `components/shared`, domain components under `components/<domain>`, and shared domain contracts under `types`. Existing `any` debt is not part of this plan, but new code must not add more.

**Tech Stack:** Next.js App Router, React, Zustand, Electron, electron-updater, axios request wrapper, shadcn/radix UI, Biome.

---

## Mandatory Rule For Every Task

- [ ] **Step 0: Define types before implementation**

Before touching feature logic, create or extend the relevant type file:

```ts
// types/<domain>.ts or types/api/<domain>.ts
export interface ExplicitFeatureModel {
  id: number | string;
  name: string;
}
```

Expected: no new `any`, `Record<string, any>`, or `as any`. Use `unknown` plus normalization at API boundaries when backend shape is uncertain.

---

## Milestone 1: Network UX First

### Task 1.1: Network Error Classifier

**Files:**
- Create: `types/network.ts`
- Create: `lib/web/networkError.ts`
- Modify: `lib/web/request.ts`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add types**

```ts
export type NetworkErrorKind = "offline" | "timeout" | "network" | "backend" | "business";

export interface ClassifiedNetworkError {
  kind: NetworkErrorKind;
  message: string;
  retryable: boolean;
}
```

- [ ] **Step 2: Implement classifier**

Rules:
- `navigator.onLine === false` -> `offline`
- axios `code === "ECONNABORTED"` -> `timeout`
- axios `code === "ERR_NETWORK"` or missing `response` -> `network`
- backend startup unavailable -> `backend`
- HTTP response with business payload -> `business`

- [ ] **Step 3: Add i18n copy**

Keys:
- `network.offline.title`
- `network.offline.subtitle`
- `network.action.refresh`
- `network.action.diagnose`
- `network.toast.unavailable`

- [ ] **Step 4: Verify**

Run:

```powershell
bun run check
```

Expected: no type or lint errors from new files.

### Task 1.2: Skeleton-Preserving Retry UI

**Files:**
- Create: `types/components/network.ts`
- Create: `components/shared/NetworkRetryState.tsx`
- Create: `components/shared/NetworkToastBridge.tsx`
- Modify: `components/MainLayout.tsx`
- Modify: `components/HomePage.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `components/Playlist/hook/usePlaylistData.ts`
- Modify: `components/album/AlbumPage.tsx`
- Modify: `hooks/artist/useArtistData.ts`
- Modify: `hooks/search/useSearchData.ts`

- [ ] **Step 1: Add component props**

```ts
export interface NetworkRetryStateProps {
  title: string;
  subtitle: string;
  onRetry: () => void;
  actionLabel?: string;
  compact?: boolean;
}
```

- [ ] **Step 2: Build retry state**

Render a compact, dark UI with warning icon, explanatory text, and a refresh button. It must be usable inside a page section without replacing the whole page.

- [ ] **Step 3: Preserve skeletons**

On retryable network failure, keep section skeleton/card placeholders visible. Do not set list data to `[]` unless the API returned a valid empty result.

- [ ] **Step 4: Add toast bridge**

Toast once per failure burst:

```ts
toast.error(t("network.toast.unavailable"), { id: "network-unavailable" });
```

- [ ] **Step 5: Verify**

Manual expected with network disabled: home, playlist, album, artist, search, comments, and sidebar show placeholders plus retry/toast instead of blank regions.

---

## Milestone 2: Login-Required Flow

### Task 2.1: Shared Login Prompt And Redirect

**Files:**
- Create: `types/auth.ts`
- Create: `components/auth/LoginRequiredPrompt.tsx`
- Create: `lib/hooks/useRequireLoginAction.ts`
- Modify: `components/auth/LoginPage.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add auth types**

```ts
export type LoginRequiredReason =
  | "album-subscribe"
  | "playlist-edit"
  | "profile-edit"
  | "comment"
  | "add-to-playlist"
  | "library"
  | "followed-artists";

export interface LoginRequiredPromptProps {
  reason: LoginRequiredReason;
  onLogin?: () => void;
  compact?: boolean;
}
```

- [ ] **Step 2: Implement login action hook**

Behavior:
- If logged in, run the requested action.
- If not logged in and Electron, open login window.
- If not logged in and Web, route to `/login?redirect=<encoded-current-url>&reason=<reason>`.

- [ ] **Step 3: Update login page copy**

Read `reason` and display contextual text. On successful Web login, redirect to `redirect` if present.

- [ ] **Step 4: Replace bare login toasts**

Use the hook/prompt in comments, album subscribe, playlist edit, add-to-playlist, sidebar library, and profile edit.

- [ ] **Step 5: Verify**

Manual expected: unauthenticated user understands which feature needs login and can return to the original page after login.

---

## Milestone 3: Playlist Tags From Official API

### Task 3.1: Playlist Tag API And Types

**Files:**
- Create: `types/api/playlistTags.ts`
- Modify: `lib/api/playlist.ts`

- [ ] **Step 1: Add tag types**

```ts
export interface PlaylistTag {
  id: number;
  name: string;
  category?: number;
  hot?: boolean;
}

export interface PlaylistHighQualityTagsResponse {
  code: number;
  tags: PlaylistTag[];
}
```

- [ ] **Step 2: Add APIs**

```ts
export function getPlaylistHighQualityTags() {
  return request.get<PlaylistHighQualityTagsResponse>("/playlist/highquality/tags");
}

export function updatePlaylistTags(id: number | string, tags: string[]) {
  return request.get("/playlist/tags/update", {
    params: { id, tags: tags.join(";") },
  });
}
```

- [ ] **Step 3: Update playlist update API**

`updatePlaylist` accepts `{ id, name, desc, tags }` and sends `tags.join(";")`.

### Task 3.2: Playlist Tag Selector UI

**Files:**
- Create: `types/components/playlist.ts`
- Create: `components/Playlist/PlaylistTagSelector.tsx`
- Modify: `components/Playlist/PlaylistForm.tsx`
- Modify: `components/Siderbar/LibItemMenu.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add component types**

```ts
export interface PlaylistTagSelectorProps {
  value: string[];
  maxSelected: number;
  onChange: (tags: string[]) => void;
}
```

- [ ] **Step 2: Build selector**

Fetch official tags, show chip skeleton while loading, allow max 3 selected, show retry on tag fetch failure.

- [ ] **Step 3: Wire form submission**

`PlaylistFormData.tags` is always `string[]`. Existing tags are preselected.

- [ ] **Step 4: Verify**

Manual expected: tags save through `/playlist/update` or `/playlist/tags/update` using `;` separator.

---

## Milestone 4: Playback Reliability

### Task 4.1: Playback Failure Fallback

**Files:**
- Modify: `types/api/music.ts`
- Modify: `store/module/player.tsx`
- Modify: `components/PlayBar/AudioManager.ts`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add typed failure state**

```ts
export type PlaybackFailureSource = "url" | "audio";
```

Store additions:

```ts
playbackFailureCount: number;
handlePlaybackFailure: (source: PlaybackFailureSource) => Promise<void>;
```

- [ ] **Step 2: Auto-next once**

On first consecutive failure, call `playNext()`. On second, stop and toast `common.message.playbackNetworkPoor`.

- [ ] **Step 3: Reset on manual play**

Manual `playFromSong` and direct row/cover play reset `playbackFailureCount` to `0`.

- [ ] **Step 4: Verify**

Manual expected: one failed song skips; two failed songs stop with one warning.

### Task 4.2: Shared Cover Play Hook

**Files:**
- Create: `types/player.ts`
- Create: `hooks/player/useCoverPlayAction.ts`
- Modify: `components/HomePage.tsx`
- Modify: `components/artist/DiscographyGrid.tsx`
- Modify: `components/search/AllView.tsx`
- Modify: `components/search/GridCategoryView.tsx`

- [ ] **Step 1: Add source type**

```ts
export type CoverPlaySource =
  | { type: "playlist"; id: number | string }
  | { type: "album"; id: number | string }
  | { type: "daily" };
```

- [ ] **Step 2: Implement hook**

Resolve tracks, set queue, start playback, and scope loading state to source key.

- [ ] **Step 3: Verify**

Manual expected: cover play works and does not trigger navigation.

---

## Milestone 5: Library And Navigation

### Task 5.1: Album Subscribe / Unsubscribe

**Files:**
- Create: `types/api/album.ts`
- Modify: `lib/api/album.ts`
- Modify: `store/module/user.ts`
- Modify: `components/album/AlbumPage.tsx`
- Modify: `components/HomePage.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add API and types**

```ts
export interface AlbumSubscribeResponse {
  code: number;
}

export function subscribeAlbum(id: number | string, subscribe: boolean) {
  return request.get<AlbumSubscribeResponse>("/album/sub", {
    params: { id, t: subscribe ? 1 : 0 },
  });
}
```

- [ ] **Step 2: Gate with login flow**

Use `useRequireLoginAction("album-subscribe")`.

- [ ] **Step 3: Optimistic update**

Update collected album state immediately, rollback on failure.

### Task 5.2: Artist Links Everywhere

**Files:**
- Create: `types/components/artist.ts`
- Create: `components/shared/ArtistInlineLinks.tsx`
- Modify: `components/Playlist/TrackRow.tsx`
- Modify: `components/SearchContents/SongRow.tsx`
- Modify: `components/artist/PopularTrackItem.tsx`
- Modify: `components/comment-page/CommentPage.tsx`

- [ ] **Step 1: Add props**

```ts
export interface ArtistLinkItem {
  id?: number | string | null;
  name: string;
}
```

- [ ] **Step 2: Replace text renderers**

Use shared component and stop propagation on click.

### Task 5.3: Sidebar Followed Artists

**Files:**
- Modify: `types/artist.ts`
- Modify: `lib/api/artist.ts`
- Modify: `store/module/user.ts`
- Modify: `components/Sidebar.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add followed artist model**

```ts
export interface FollowedArtist {
  id: number;
  name: string;
  avatarUrl: string;
}
```

- [ ] **Step 2: Fetch independently**

Artist fetch failure should render a compact retry state only inside the artist group.

---

## Milestone 6: App Operations And Polish

### Task 6.1: Desktop Update UI

**Files:**
- Create: `types/updater.ts`
- Create: `hooks/settings/useAppUpdater.ts`
- Modify: `components/settings/SettingsPage.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Reuse updater IPC types**

Keep `UpdateState` aligned with `types/electron.d.ts`; export shared type if needed.

- [ ] **Step 2: Add Settings section**

Show status, progress, check/download/install button.

### Task 6.2: User Profile Editing

**Files:**
- Create: `types/api/profileUpdate.ts`
- Create: `components/profile/EditUserProfileDialog.tsx`
- Modify: `lib/api/user.ts`
- Modify: `components/profile/UserProfilePage.tsx`
- Modify: `store/module/user.ts`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add payload type**

```ts
export interface UpdateUserProfilePayload {
  nickname: string;
  signature?: string;
  gender?: 0 | 1 | 2;
  birthday?: number;
  province?: number;
  city?: number;
}
```

- [ ] **Step 2: Gate with login flow**

Use `useRequireLoginAction("profile-edit")`.

### Task 6.3: Artist Expand/Collapse And Web Shortcuts

**Files:**
- Modify: `components/artist/PopularTracks.tsx`
- Create: `hooks/player/usePlaybackShortcuts.ts`
- Modify: `components/PlayerCommandHandler.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Artist expand/collapse**

Default 10, expanded full fetched list, collapse back to 10.

- [ ] **Step 2: Playback shortcuts**

Ignore input, textarea, select, and contenteditable.

---

## Recommended Execution Order

1. Network failure classifier and skeleton retry UI
2. Shared login-required flow
3. Playlist tag official API and selector
4. Playback failure fallback
5. Shared cover play hook
6. Album subscribe/unsubscribe
7. Artist links everywhere
8. Sidebar followed artists
9. Desktop update UI
10. User profile editing
11. Artist expand/collapse
12. Web playback shortcuts

## Notes

- Daily recommendation date-based cache is already implemented.
- Existing `any` cleanup is intentionally deferred; new work must be typed from the start.
- Backend package-size work continues under `docs/superpowers/plans/2026-06-19-desktop-delivery-backend-decoupling.md`.

