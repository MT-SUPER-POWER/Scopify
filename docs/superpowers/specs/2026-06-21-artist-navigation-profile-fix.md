---
name: artist-navigation-and-profile-fix
description: Add "View Artist" to context menus, make artist names clickable, fix profile dropdown white background
metadata:
  type: project
---

# Artist Navigation & Profile Dropdown Fix

Date: 2026-06-21
Author: Claude

## Issue 1: Artist Navigation from Songs

### Background
The artist (composer) pages are fully implemented (`/artist?id=xxx`). However, users have no way to navigate to an artist page from song context menus, and some artist name displays are not clickable.

### Changes

#### A. Context Menu — "View Artist" Option
Add a menu item/submenu to three context menu components:

1. **`components/Playlist/TrackTable.tsx`** — Main track table context menu
   - Add between "评论" and "复制链接" items
   - If the song has multiple artists (`track.ar.length > 1`), use a submenu listing all artists
   - If single artist, use a direct menu item
   - Icon: `Music2` or `User` lucide icon
   - Each artist item navigates to `/artist?id=${artist.id}` via `useSmartRouter()`

2. **`components/search/SongItem.tsx`** — Search results song context menu
   - Same pattern as above
   - The `song` object has `song.artists` (from `Song` type) which maps to `{id, name}`

3. **`components/artist/PopularTrackItem.tsx`** — Artist page popular tracks context menu
   - Same pattern, using `track.ar`

#### B. Make Artist Names Clickable
Replace plain-text artist names with clickable links in:

1. **`components/search/SongItem.tsx`** (L237-241)
   - Replace the `<span>` displaying `artistNames` with `ArtistInlineLinks` component
   - Pass `song.artists.map(a => ({id: a.id, name: a.name}))`

2. **`components/QueuePopover.tsx`** (L101-103)
   - Replace `song.ar.map((a: any) => a.name).join(", ")` with `ArtistInlineLinks`
   - Import `useSmartRouter` for navigation

3. **`components/search/BestMatchCard.tsx`** (L73-75)
   - Replace artist name span with `ArtistInlineLinks` or inline clickable buttons

#### C. i18n
Add new key `contextMenu.goToArtist: "查看歌手" / "查看歌手" / "View Artist"` in:
- `lib/i18n.ts` — Chinese section (L170+)
- `lib/i18n.ts` — Traditional Chinese section (L628+)
- `lib/i18n.ts` — English section (L1096+)

## Issue 2: Profile Dropdown White Background

### Root Cause
`ProfileMenu.tsx` uses `DropdownMenuContent` from `components/ui/dropdown-menu.tsx`, which renders via `Portal` and relies on the CSS variable `bg-popover`. The context menu components (`ContextMenuContent`) work correctly because they explicitly override the background with `bg-[#282828] text-white border-white/10`. The profile dropdown lacks this explicit override, causing white background in certain dark mode scenarios.

### Fix
Add explicit styling `bg-[#282828] text-white border-white/10` to the `DropdownMenuContent` in `ProfileMenu.tsx`, matching the pattern used by context menus.

## Files Changed

| File | Change |
|------|--------|
| `components/Playlist/TrackTable.tsx` | Add "View Artist" context menu item |
| `components/search/SongItem.tsx` | Add "View Artist" context menu item + make artist names clickable |
| `components/artist/PopularTrackItem.tsx` | Add "View Artist" context menu item |
| `components/QueuePopover.tsx` | Make artist names clickable |
| `components/search/BestMatchCard.tsx` | Make artist names clickable |
| `components/Header/ProfileMenu.tsx` | Fix white background by adding explicit dark class |
| `lib/i18n.ts` | Add `contextMenu.goToArtist` translation keys |

## Architecture
- Navigation uses existing `useSmartRouter` hook (client-side push without full reload)
- Artist link pattern matches existing implementation in `TrackRow.tsx` and `PlayerBar.tsx`
- No new API calls or data fetching required — artist IDs are already on the song objects
