# Artist Navigation & Profile Dropdown Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "View Artist" to song context menus, make artist name displays clickable, and fix profile dropdown white background.

**Architecture:** Uses existing `ArtistInlineLinks` component and `useSmartRouter` hook for navigation. Context menu items reuse existing `ContextMenu` UI primitives. The profile dropdown fix matches the same explicit background pattern already used by context menus.

**Tech Stack:** Next.js 15, Tailwind CSS v4, Radix UI (ContextMenu, DropdownMenu), Lucide icons

## Global Constraints

- All new icons: use `User` from `lucide-react`
- Artist navigation path: `/artist?id=${id}`
- Navigation hook: `useSmartRouter` from `@/lib/hooks/useSmartRouter`
- Clickable artist component: `ArtistInlineLinks` from `@/components/shared/ArtistInlineLinks` (accepts `artists: ArtistLinkItem[]`)
- i18n key: `contextMenu.goToArtist` = "查看歌手" / "查看歌手" / "View Artist"
- Profile dropdown fix: use classes `bg-[#282828] text-white border-white/10` (matching existing context menu pattern)

---

### Task 1: Add i18n translation key

**Files:**
- Modify: `lib/i18n.ts`

**Interfaces:**
- Consumes: existing `contextMenu.*` key pattern
- Produces: `contextMenu.goToArtist` key in all three languages

- [ ] **Step 1: Add Chinese (Simplified) key**

Find line ~179 (after `"contextMenu.recommendLess"`):
```ts
  "contextMenu.recommendLess": "减少推荐",
```
Add after it:
```ts
  "contextMenu.goToArtist": "查看歌手",
```

- [ ] **Step 2: Add Chinese (Traditional) key**

Find line ~637 (after `"contextMenu.recommendLess"` in traditional section):
```ts
  "contextMenu.recommendLess": "減少推薦",
```
Add after it:
```ts
  "contextMenu.goToArtist": "查看歌手",
```

- [ ] **Step 3: Add English key**

Find line ~1105 (after `"contextMenu.recommendLess"` in English section):
```ts
  "contextMenu.recommendLess": "Recommend less",
```
Add after it:
```ts
  "contextMenu.goToArtist": "View Artist",
```

- [ ] **Step 4: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat(i18n): add contextMenu.goToArtist translation key"
```

---

### Task 2: Fix Profile Menu dropdown white background

**Files:**
- Modify: `components/Header/ProfileMenu.tsx`

**Interfaces:**
- Produces: Dropdown with explicit dark background

- [ ] **Step 1: Add explicit dark background classes**

In `ProfileMenu.tsx` line 77, change the `DropdownMenuContent` className from:
```tsx
        className="w-68 max-w-[calc(100vw-2rem)] rounded-xl p-2"
```
to:
```tsx
        className="w-68 max-w-[calc(100vw-2rem)] rounded-xl p-2 bg-[#282828] text-white border-white/10"
```

- [ ] **Step 2: Commit**

```bash
git add components/Header/ProfileMenu.tsx
git commit -m "fix(ui): add explicit dark background to profile dropdown menu"
```

---

### Task 3: Add "View Artist" to TrackTable context menu

**Files:**
- Modify: `components/Playlist/TrackTable.tsx`

**Interfaces:**
- Consumes: `contextMenuTrack: SongDetail | null` (has `.ar: Array<{id, name}>`)
- Requires: `User` icon from `lucide-react`, `Link` from `next/link` (already imported)

- [ ] **Step 1: Add `User` to lucide imports**

Find line 7-18:
```ts
import {
  Ban, Clock, GripVertical, Heart, Link2, ListPlus, Pause,
  Play, PlusCircle, RefreshCw, Trash,
} from "lucide-react";
```
Change to:
```ts
import {
  Ban, Clock, GripVertical, Heart, Link2, ListPlus, Pause,
  Play, PlusCircle, RefreshCw, Trash, User,
} from "lucide-react";
```

- [ ] **Step 2: Add "View Artist" menu item between comments and copyLink**

Find this block (lines ~594-619):
```tsx
              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <Link
                  href={contextMenuTrack.id ? `/comment/?songId=${contextMenuTrack.id}` : "#"}
                  className="w-full h-full block focus:bg-white/10 focus:text-white"
                >
                  <FaRegCommentDots className="w-4 h-4 mr-2" />
                  {t("contextMenu.comments")}
                </Link>
              </ContextMenuItem>

              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <button
                  type="button"
                  onClick={() => {
```

Add the artist item after the comments item and before the copyLink item:

```tsx
              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <Link
                  href={contextMenuTrack.id ? `/comment/?songId=${contextMenuTrack.id}` : "#"}
                  className="w-full h-full block focus:bg-white/10 focus:text-white"
                >
                  <FaRegCommentDots className="w-4 h-4 mr-2" />
                  {t("contextMenu.comments")}
                </Link>
              </ContextMenuItem>

              {/* View Artist */}
              {contextMenuTrack.ar.length > 0 && (
                contextMenuTrack.ar.length === 1 ? (
                  <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                    <Link
                      href={`/artist?id=${contextMenuTrack.ar[0].id}`}
                      className="w-full h-full block focus:bg-white/10 focus:text-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t("contextMenu.goToArtist")}
                    </Link>
                  </ContextMenuItem>
                ) : (
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                      <User className="w-4 h-4 mr-4" />
                      {t("contextMenu.goToArtist")}
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="bg-[#282828] text-white border-white/10">
                      {contextMenuTrack.ar.map((artist) => (
                        <ContextMenuItem key={artist.id} asChild className="focus:bg-white/10 focus:text-white">
                          <Link
                            href={`/artist?id=${artist.id}`}
                            className="w-full h-full block"
                          >
                            {artist.name}
                          </Link>
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                )
              )}

              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <button
                  type="button"
                  onClick={() => {
```

- [ ] **Step 3: Commit**

```bash
git add components/Playlist/TrackTable.tsx
git commit -m "feat(ui): add View Artist to track table context menu"
```

---

### Task 4: Add "View Artist" + clickable artist names in search SongItem

**Files:**
- Modify: `components/search/SongItem.tsx`

**Interfaces:**
- Consumes: `song: Song` (has `.artists: Artist[]` where `Artist` has `{id, name}`)
- Uses: `ArtistInlineLinks` for clickable names, `User` icon for context menu

- [ ] **Step 1: Add `User` to lucide imports and add `ArtistInlineLinks` import**

Find the import block (lines ~4-32):
```ts
import { Heart, Link2, ListPlus, Pause, Play, PlusCircle } from "lucide-react";
```
Change to:
```ts
import { Heart, Link2, ListPlus, Pause, Play, PlusCircle, User } from "lucide-react";
```

Add after the last `shadcn` import:
```ts
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
```

- [ ] **Step 2: Make artist names clickable in the song display**

Find lines ~236-242:
```tsx
              <span
                title={artistNames}
                className="text-zinc-400 text-xs truncate hover:text-white hover:underline cursor-pointer"
              >
                {artistNames}
              </span>
```
Replace with:
```tsx
              <ArtistInlineLinks
                artists={song.artists.map((a) => ({ id: a.id, name: a.name }))}
                className="text-zinc-400 text-xs truncate cursor-pointer"
              />
```

- [ ] **Step 3: Add "View Artist" to context menu**

Find the comment menu item (lines ~344-349):
```tsx
            <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
              <Link href={`/comment/?songId=${song.id}`} className="w-full h-full block">
                <FaRegCommentDots className="w-4 h-4 mr-2" />
                {t("contextMenu.comments")}
              </Link>
            </ContextMenuItem>
```

Add after it:
```tsx
            {/* View Artist */}
            {song.artists.length > 0 && (
              song.artists.length === 1 ? (
                <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
                  <Link href={`/artist?id=${song.artists[0].id}`} className="w-full h-full block">
                    <User className="w-4 h-4 mr-2" />
                    {t("contextMenu.goToArtist")}
                  </Link>
                </ContextMenuItem>
              ) : (
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                    <User className="w-4 h-4 mr-4" />
                    {t("contextMenu.goToArtist")}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="bg-[#282828] text-white border-white/10">
                    {song.artists.map((artist) => (
                      <ContextMenuItem key={artist.id} asChild className="focus:bg-white/10 focus:text-white">
                        <Link
                          href={`/artist?id=${artist.id}`}
                          className="w-full h-full block"
                        >
                          {artist.name}
                        </Link>
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )
            )}
```

- [ ] **Step 4: Commit**

```bash
git add components/search/SongItem.tsx
git commit -m "feat(ui): add View Artist context menu and clickable artist names in search"
```

---

### Task 5: Add "View Artist" to PopularTrackItem context menu

**Files:**
- Modify: `components/artist/PopularTrackItem.tsx`

**Interfaces:**
- Consumes: `track: SongDetail` (has `.ar: Array<{id, name}>`)
- Requires: `User` icon, `Link` from `next/link` (already imported)

- [ ] **Step 1: Add `User` to lucide imports**

Find line 3:
```ts
import { Heart, Link2, ListPlus, Pause, Play, PlusCircle } from "lucide-react";
```
Change to:
```ts
import { Heart, Link2, ListPlus, Pause, Play, PlusCircle, User } from "lucide-react";
```

- [ ] **Step 2: Add "View Artist" to context menu**

Find the comment menu item (lines ~297-302):
```tsx
            <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
              <Link href={`/comment/?track.id=${track.id}`} className="w-full h-full block">
                <FaRegCommentDots className="w-4 h-4 mr-2" />
                {t("contextMenu.comments")}
              </Link>
            </ContextMenuItem>
```

Wait, I need to check the actual code again. Let me look at the line more carefully...

From my earlier read, the comments item in PopularTrackItem.tsx is at line 297-302:
```tsx
            <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
              <Link href={`/comment/?songId=${track.id}`} className="w-full h-full block">
                <FaRegCommentDots className="w-4 h-4 mr-2" />
                {t("contextMenu.comments")}
              </Link>
            </ContextMenuItem>
```

Add after it:
```tsx
            {/* View Artist */}
            {track.ar.length > 0 && (
              track.ar.length === 1 ? (
                <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
                  <Link href={`/artist?id=${track.ar[0].id}`} className="w-full h-full block">
                    <User className="w-4 h-4 mr-2" />
                    {t("contextMenu.goToArtist")}
                  </Link>
                </ContextMenuItem>
              ) : (
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                    <User className="w-4 h-4 mr-4" />
                    {t("contextMenu.goToArtist")}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="bg-[#282828] text-white border-white/10">
                    {track.ar.map((artist) => (
                      <ContextMenuItem key={artist.id} asChild className="focus:bg-white/10 focus:text-white">
                        <Link
                          href={`/artist?id=${artist.id}`}
                          className="w-full h-full block"
                        >
                          {artist.name}
                        </Link>
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )
            )}
```

- [ ] **Step 3: Commit**

```bash
git add components/artist/PopularTrackItem.tsx
git commit -m "feat(ui): add View Artist to popular track context menu"
```

---

### Task 6: Make artist names clickable in QueuePopover

**Files:**
- Modify: `components/QueuePopover.tsx`

**Interfaces:**
- Consumes: `song: SongDetail` (has `.ar: Array<{id, name}>`)
- Uses: `ArtistInlineLinks` for clickable names

- [ ] **Step 1: Add imports**

After existing imports, add:
```ts
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
```

- [ ] **Step 2: Replace artist name text with clickable links**

In the `QueueItem` component, find lines ~101-103:
```tsx
            <div className="text-xs text-zinc-400 truncate mt-0.5">
              {song.ar.map((a: any) => a.name).join(", ")}
            </div>
```
Replace with:
```tsx
            <div className="text-xs text-zinc-400 truncate mt-0.5">
              <ArtistInlineLinks
                artists={song.ar.map((a: { id: number; name: string }) => ({ id: a.id, name: a.name }))}
              />
            </div>
```

- [ ] **Step 3: Commit**

```bash
git add components/QueuePopover.tsx
git commit -m "feat(ui): make artist names clickable in queue popover"
```

---

### Task 7: Make artist names clickable in BestMatchCard

**Files:**
- Modify: `components/search/BestMatchCard.tsx`

**Interfaces:**
- Consumes: `song: Song | null` (has `.artists: Artist[]`)
- Uses: `ArtistInlineLinks` or inline clickable buttons

- [ ] **Step 1: Add `ArtistInlineLinks` import**

After existing imports, add:
```ts
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
```

- [ ] **Step 2: Replace artist name span with clickable component**

Find lines ~72-76:
```tsx
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="text-white hover:underline font-medium">
              {song.artists?.map((a) => a.name).join(", ") || t("search.song.unknownArtist")}
            </span>
            <span className="px-2 py-0.5 bg-black/50 rounded-full text-[11px] font-bold tracking-wide uppercase">
```
Replace with:
```tsx
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <ArtistInlineLinks
              artists={(song.artists ?? []).map((a) => ({ id: a.id, name: a.name }))}
              className="font-medium"
            />
            <span className="px-2 py-0.5 bg-black/50 rounded-full text-[11px] font-bold tracking-wide uppercase">
```

- [ ] **Step 3: Commit**

```bash
git add components/search/BestMatchCard.tsx
git commit -m "feat(ui): make artist names clickable in best match card"
```

---

## Summary

| Task | File | Change | Dependency |
|------|------|--------|-----------|
| 1 | `lib/i18n.ts` | Add `contextMenu.goToArtist` keys | None |
| 2 | `components/Header/ProfileMenu.tsx` | Fix white background | None |
| 3 | `components/Playlist/TrackTable.tsx` | Add "View Artist" context menu | Task 1 |
| 4 | `components/search/SongItem.tsx` | Add "View Artist" + clickable names | Task 1 |
| 5 | `components/artist/PopularTrackItem.tsx` | Add "View Artist" context menu | Task 1 |
| 6 | `components/QueuePopover.tsx` | Clickable artist names | None |
| 7 | `components/search/BestMatchCard.tsx` | Clickable artist names | None |

Tasks 2, 6, 7 can be executed in parallel with Task 1. Tasks 3, 4, 5 depend on Task 1.
