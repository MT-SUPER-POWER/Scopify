# Scopify

Scopify is a family of NetEase Cloud Music clients that coordinate music data, playback, and user interactions across Web, Electron, and mobile runtimes.

## Client Boundaries

**Shared Backend**:
The independent music API service used by Scopify clients. It is a common service boundary, not a shared frontend, playback implementation, or release cycle.
_Avoid_: shared client, mobile adapter, frontend runtime

## Language

**Scopify React Design System**:
The shared interface language and behavioral contract for Scopify's Web and Electron renderer surfaces. It does not govern the Flutter mobile client or replace Lyric Stage-specific visual themes.
_Avoid_: cross-platform component library, Flutter UI kit, Lyric Stage theme library

**Application Theme**:
A named global appearance of the Scopify React Design System with coordinated light and dark visual choices. It applies to ordinary Web and Electron renderer surfaces without changing the Lyric Stage Theme Library.
_Avoid_: Lyric Stage theme, page-local palette, isolated component skin

**Default Application Theme**:
The built-in Application Theme with matched light and dark variants: its dark variant preserves Scopify's recognizable current interface as the migration baseline, while its light variant is designed as a deliberate companion. It is a normalized visual language rather than a promise to retain every legacy hard-coded value.
_Avoid_: legacy stylesheet, hard-coded-value catalogue, Lyric Stage default theme

**Folia**:
A source project whose lyric-rendering and desktop-lyric implementation may be adapted into Scopify. Folia remains a separate product and is not an integrated runtime component.
_Avoid_: external integration, Folia player

**Folia-derived code**:
Scopify code copied from or adapted from Folia under AGPL-3.0. It retains Folia's required copyright and license notices.
_Avoid_: independent implementation, runtime dependency

**Folia Playback Stage**:
The complete source-preserved single-page playback presentation from the Folia Source Snapshot: its shared renderer, shell and subtitle overlay; all nine Visualizer Modes; all six backgrounds; floating controls, progress bar and lyric timeline; chrome auto-hide; visual settings; built-in assets; and responsive animation runtime.
_Avoid_: Folia-style screen, starter visualizers, simplified renderer

**Scopify Host Adapter**:
The Scopify-owned boundary that supplies the Folia Playback Stage with normalized lyrics, MotionValue clocks, audio bands, track metadata, themes, persisted settings, and playback commands while leaving NetEase session, audio, queue, cache, and playback ownership in Scopify.
_Avoid_: second player, Folia fork logic, vendored integration state

**Interface Gap**:
A Folia Playback Stage input, action, or local resource capability that the Scopify Host Adapter cannot yet provide. An Interface Gap is recorded explicitly and the affected capability remains unavailable until implemented; it never authorizes a simplified visualizer or substitute UI.
_Avoid_: deferred visualizer, acceptable approximation, silent fallback

**Lyric Presentation Subsystem**:
The Scopify renderer and Electron modules that parse, time, and present lyrics, including immersive and desktop-lyric surfaces. It consumes Playback State and Remote Music Data without owning either.
_Avoid_: player, music service

**Desktop Lyric Window**:
A transparent, frameless optional Electron companion surface that renders the Lyric Presentation Subsystem outside Scopify's main window. It may send transport or stage commands to Scopify but never owns audio, queue, or playback state.
_Avoid_: player window, mini player

**Desktop Lyric Command**:
A user action initiated in the Desktop Lyric Window and executed by the Scopify playback or lyric-stage owner. The command does not transfer state ownership to the companion surface.
_Avoid_: secondary player state, window-local playback

**Desktop Playback Wallpaper**:
An optional Windows desktop presentation of Scopify's current playback behind the desktop icons. It may show its Background Layer, Lyric Layer, or both, but never owns audio, queue, or playback state.
_Avoid_: Desktop Lyric Window, fullscreen player, system wallpaper

**Wallpaper Background Layer**:
The shared visual backdrop selected from Folia's background catalogue for a Desktop Playback Wallpaper. It is independently visible from the selected Visualizer Mode.
_Avoid_: Windows system wallpaper, lyric text, wallpaper window

**Wallpaper Lyric Layer**:
The selected Folia Visualizer Mode presented by a Desktop Playback Wallpaper, including its timed lyrics and mode-owned visual composition. It is independently visible from the shared Background Layer.
_Avoid_: Desktop Lyric Window, wallpaper background, playback owner

**Desktop Playback Controller Window**:
A dedicated auxiliary Scopify window that presents playback controls together with Desktop Playback Wallpaper intent and status while the main window may be hidden. It controls the presentation without hosting it or owning playback.
_Avoid_: wallpaper window, DockMenu Playback Panel, second player

**DockMenu Playback Panel**:
The compact control surface revealed from Scopify's Windows tray entry. It exposes essential playback and wallpaper actions and may open the full Desktop Playback Controller Window.
_Avoid_: Desktop Playback Controller Window, native context menu, second player

**Desktop Playback Controller Launcher**:
An entry point, such as the PlayBar desktop-music button, that asks the host to show the existing Desktop Playback Controller Window. A Launcher never duplicates the controller's state or behavior.
_Avoid_: second controller, embedded controller state, wallpaper toggle implementation

**System Wallpaper Fallback**:
An optional static companion image used while the Wallpaper Background Layer is active so Windows Shell surfaces that cannot show the dynamic presentation can still visually match it. It is not the Desktop Playback Wallpaper and must be relinquished when Scopify no longer owns the presentation.
_Avoid_: dynamic wallpaper, taskbar renderer, permanent wallpaper replacement

**Visualizer Mode**:
One independently selectable immersive lyric presentation rendered against a shared song, timeline, theme, and interaction contract.
_Avoid_: page, player

**Visualizer Registry**:
The ordered catalogue of Visualizer Modes and their optional settings panels. It is the extension point for adding a visual treatment without changing the lyric-stage host.
_Avoid_: switch statement, hard-coded mode list

**Lyric Stage**:
A browser-compatible full-screen Scopify surface that mounts the complete Folia Playback Stage through the Scopify Host Adapter. It is available in both Scopify's Web and Electron runtimes and is opened from Scopify's existing lyrics action or an In-Window Shortcut.
_Avoid_: desktop window, player

**Lyric Stage Theme Library**:
The persisted collection of named, JSON-serializable Dual Themes available only to the Lyric Stage. It is renderer state owned by Zustand; it does not change Scopify's application-wide appearance.
_Avoid_: application theme, Folia runtime registry

**Dual Theme**:
One Lyric Stage theme with matched light and dark color variants. The Visual Settings brightness tabs select the active variant of the selected theme.
_Avoid_: two unrelated themes, application dark-mode setting

**Legacy Lyric Modal**:
The former Scopify full-screen LRC surface. It is replaced by the Lyric Stage and has no active runtime path after the migration.
_Avoid_: Lyric Stage, supported lyric renderer

**Folia Visualizer Suite**:
The complete set of Visualizer Modes registered by Folia at the selected source revision, together with their settings panels and rendering dependencies. It is one part of the Folia Playback Stage and ships as a single capability rather than a limited starter subset.
_Avoid_: starter modes, optional later work

**Raw NetEase Lyric**:
The complete lyric source supplied for a track by NetEase, including plain and word-timed text, translations, romanizations, and attribution. It is the source material for a Lyric Presentation Subsystem rather than a display-ready lyric document.
_Avoid_: clipped lyric, LRC-only lyric

**AI Lyric Theme**:
An optional user-configured generator that derives visual parameters from a song's lyrics and cover. It is not required for the Lyric Stage or Folia Visualizer Suite.
_Avoid_: default theme, required visualizer feature

**In-Window Shortcut**:
A configurable key combination processed by the Scopify renderer only while its main window has focus. It coordinates playback or navigation without registering an operating-system global shortcut.
_Avoid_: global shortcut, system hotkey

**Shortcut Registry**:
A user-configurable catalogue that maps each named Scopify command to a built-in key combination and an optional user override. It makes bindings visible, editable, and resettable from one interface.
_Avoid_: global shortcut registry, scattered key listeners

**Primary Modifier**:
The platform-appropriate primary modifier used by an In-Window Shortcut: `Ctrl` on Windows and Linux, and `Cmd` on macOS.
_Avoid_: Windows-only Ctrl, macOS-only Cmd

**Shortcut Conflict**:
The invalid state in which two Scopify commands have the same effective In-Window Shortcut. A Shortcut Registry rejects the new binding and retains the existing one.
_Avoid_: command priority, last binding wins

**Text Entry Context**:
A focused text input, text area, or editable content surface. In this context, only the search shortcut may run; playback and modal shortcuts are inactive, while the shortcut recorder captures keys for editing a binding.
_Avoid_: global keyboard block, normal page focus

**Sidebar Toggle Command**:
The shortcut command that switches the main navigation sidebar between expanded and collapsed states. Its built-in In-Window Shortcut is `Primary Modifier + B`.
_Avoid_: browser bookmark shortcut, window resize

**Shortcut Management Surface**:
The dedicated settings interface for browsing, editing, detecting conflicts in, and resetting Shortcut Registry bindings. It is distinct from a transient keyboard-help display.
_Avoid_: static shortcut documentation, command palette

**Command Palette**:
A searchable transient interface for finding and executing named Scopify commands without navigating to their UI. It complements, but does not replace, the Shortcut Management Surface.
_Avoid_: shortcut registry, settings page

**Keyboard Help Panel**:
A read-only, transient display of commonly used In-Window Shortcuts. It helps discovery without providing binding-editing controls.
_Avoid_: shortcut management surface, command palette

**Shortcut Runtime Parity**:
The rule that the Shortcut Registry exposes the same commands, defaults, conflict rules, and interactions in Scopify's Web and Electron runtimes.
_Avoid_: Electron-only key bindings, runtime-specific shortcut catalogues

**Shortcut Override**:
A device-scoped user replacement for a command's built-in In-Window Shortcut. It persists in the current browser or Electron installation and is independent of the signed-in music account.
_Avoid_: account preference, synced profile setting

**Shortcut Combination**:
One simultaneous key press composed of zero or more modifiers and one primary key. The initial Shortcut Registry does not support ordered multi-key sequences.
_Avoid_: key chord sequence, multi-step shortcut

**Shortcut Binding Rule**:
A Shortcut Override requires at least one modifier. The only bare-key exceptions are the built-in `Space` playback toggle and the fixed `Esc` exit behavior for the Lyric Stage.
_Avoid_: bare letter binding, bare navigation-key binding

**Shortcut Volume Step**:
The amount by which an In-Window Shortcut changes playback volume: five percentage points, clamped to the inclusive range from zero to one hundred percent.
_Avoid_: arbitrary volume delta, unclamped volume change

**Mute Restore Level**:
The last non-zero playback volume saved when a user mutes audio. Repeating the mute command restores exactly that value rather than a fixed volume.
_Avoid_: default-volume restore, always restore to one hundred percent

**Keyboard Invocation**:
The keyboard-triggered invocation of an existing Scopify UI action. It reuses that action's availability checks, state transitions, and user feedback instead of creating shortcut-specific behavior.
_Avoid_: parallel shortcut business logic, shortcut-only feedback

**Fullscreen Command**:
A registered command that enters or exits the host runtime's application fullscreen mode. Its built-in In-Window Shortcut is `Primary Modifier + Shift + F`, rather than the browser-reserved `F11`.
_Avoid_: native F11 behavior, window-only fullscreen

**Settings Tab**:
A top-level category in the Settings surface that presents a focused subset of configuration while preserving the existing two-column setting layout within its content.
_Avoid_: a separate settings route, an ungrouped long-form settings page

**Shortcut Settings Tab**:
The Settings Tab containing the Shortcut Management Surface. It gives the Shortcut Registry a focused editing workspace while remaining part of Settings.
_Avoid_: standalone shortcut route, keyboard-help panel

## Radio and Voice Content

**DJ Radio**:
NetEase's legacy radio container, identified by `djRadioId` or `rid`; it contains DJ Programs and is independent of a Voice List.
_Avoid_: podcast list, voice list

**DJ Program**:
One legacy episode inside a DJ Radio, identified by its program ID and associated with a playable `mainTrackId`.
_Avoid_: Voice, playlist track

**Voice List**:
A workbench-defined podcast container, identified by `voiceListId`; it has its own cover, category, and ordered Voices.
_Avoid_: DJ Radio, playlist

**Voice**:
A workbench-defined sound item, identified by `voiceId`, that belongs to a Voice List and has publication status and optional lyrics.
_Avoid_: DJ Program

**Recommended Voice Feed**:
The `recommendVoiceVOS` result from `/v1/pc/voicelist/rcmd/list`; each item references a DJ Radio and embeds a DJ Program, so it is not a Voice List result.
_Avoid_: recommended voice list, podcast-list recommendation

## Playlist Structure

**Playlist Content**:
The playlist body beneath its metadata. It contains playlist actions and the Tracklist; it is not a single track row.
_Avoid_: track row, table cell

**Tracklist**:
The ordered collection of tracks displayed within Playlist Content, including its column headings and Track Rows.
_Avoid_: playlist content, individual track row

**Track Row**:
One displayed track within a Tracklist. Its cells follow the Tracklist's shared column alignment.
_Avoid_: playlist content, table-wide layout

**Tracklist Adjacent-Column Resize**:
The temporary Tracklist column-resize interaction in which moving one visible column divider changes only the width of the column on its left and the immediately adjacent visible column on its right. Every visible column other than the fixed Tracklist Index Column participates. The Tracklist's total width remains fixed and every uninvolved column keeps its position and width throughout the drag. When either affected column reaches its minimum width, the divider stops rather than moving a third column or expanding the Tracklist. Its widths exist only while that Tracklist is mounted; returning to the view restores defaults.
_Avoid_: persistent user preference, whole-table reflow, proportional resize, independent column expansion

**Tracklist Index Column**:
The Tracklist's leading `#` column. Its compact width is fixed and never gives or receives width during Tracklist Adjacent-Column Resize.
_Avoid_: resizable metadata column, content column

**Tracklist Resize Divider**:
The mouse, touch, and pen dedicated drag handle for the logical boundary between two participating visible Tracklist columns. It is represented only by the compact grip without a visible boundary line. Dragging it starts Tracklist Adjacent-Column Resize; clicking the header label retains the column's ordinary sort behavior. No divider follows the fixed Tracklist Index Column; the last visible column participates through the divider on its left. It has no keyboard-resize interaction in this scope and does not require a long-press gesture for touch.
_Avoid_: whole-header drag, sort gesture, row drag handle, keyboard resize, touch long press, fixed-index divider, last-column-only handle

**Tracklist Resize Feedback**:
The active presentation of a Tracklist Resize Divider: only the compact grip is highlighted, the pointer uses the `col-resize` cursor, and text selection is disabled. Its two columns update immediately without a transition for the duration of the drag; no column-boundary line is drawn.
_Avoid_: visible boundary line, delayed resize, animated drag lag, selectable header text, ambiguous active divider

**Tracklist Resize Pair Reset**:
The double-click action on a Tracklist Resize Divider. It redistributes only the two adjacent columns' current combined width according to their Tracklist Default Column Hierarchy proportions, leaving every other column unchanged.
_Avoid_: whole-Tracklist reset, content auto-fit, unrelated-column movement

**Tracklist Column Layout Model**:
The Scopify-owned, single source of truth that assigns default widths to the visible Tracklist columns and applies Tracklist Adjacent-Column Resize constraints. It replaces TanStack column sizing as the authority for Tracklist widths while retaining TanStack only for row and sorting models. Initial layouts and responsive breakpoint changes distribute the available width by percentage; an active resize uses controlled pixel deltas only for the two affected columns. Whenever the visible column set changes at a responsive breakpoint, it creates a fresh default layout for that set rather than carrying temporary widths across breakpoints.
_Avoid_: competing width systems, browser-derived table reflow, breakpoint-width carryover, TanStack-owned column width

**Tracklist Default Column Hierarchy**:
The initial allocation of a Tracklist Column Layout Model after the fixed Tracklist Index Column is removed from the available width. At the full desktop breakpoint, its percentages are title 40, album 30, date 15, like 7, and duration 8. At the medium breakpoint, where date and like are hidden, they are title 60, album 30, and duration 10. At the compact breakpoint, where only title and duration remain, they are title 86 and duration 14. Every visible column except the Tracklist Index Column may later give or receive width through Tracklist Adjacent-Column Resize.
_Avoid_: equal-width columns, immutable metadata columns, title-starved default layout

**Tracklist Column Minimums**:
The smallest widths that a Tracklist Adjacent-Column Resize may assign: title 200px, album 120px, date 104px, like 48px, duration 72px, and the fixed Tracklist Index Column 56px.
_Avoid_: unreadable shrink, overflow-driven width, content-dependent minimum

**Playlist Tracklist Sticky Header**:
The Global Header remains visible while the Tracklist column headings stay fixed beneath it. Playlist Action remains in the normal content flow.
_Avoid_: sticky playlist action, direction-based playlist control reveal

## State Ownership

**Remote Music Data**:
Data obtained from the NetEase backend, including music catalog, recommendations, playlists, albums, artists, comments, search results, and user profile data. It has a cache and lifecycle owned by the query layer.
_Avoid_: Zustand data, page state

**Renderer State**:
Local state that describes the Scopify renderer itself, including playback, UI preferences, dialogs, and the authenticated-session snapshot. It is owned by Zustand or component state.
_Avoid_: Remote Music Data, backend cache

**Navigation Entry Scroll State**:
The content position associated with one browser-history entry. Backward or forward navigation restores that entry's prior position, while a newly created navigation entry starts at the top.
_Avoid_: URL scroll state, route scroll cache, global page position

**Restoration Pending State**:
The temporary state of a history traversal whose target content position is not ready to reveal. Scopify presents the target page's Skeleton until restoration settles rather than exposing an incorrect position and visibly jumping.
_Avoid_: top flash, delayed scroll jump, background page

**Persistent Music Cache**:
The selected subset of Remote Music Data retained across Scopify restarts for fast return visits. It is a persisted portion of the query cache rather than a separate page cache.
_Avoid_: pageCache, duplicate cache

**Account-Scoped Music Data**:
Remote Music Data whose meaning depends on the authenticated Scopify user, including profiles, libraries, daily recommendations, and comments. It is removed when the authenticated account changes.
_Avoid_: public catalog data, shared cache

**Song Access Badge**:
A compact, locally selected visual marker for a song whose model reports paid or VIP-gated playback. It describes the song's access requirement, never the current listener's membership level.
_Avoid_: user VIP level, account badge, playback entitlement result

**Song Quality Badge**:
A compact visual marker for the highest meaningful audio-quality tier available for a song. It is independent of Song Access Badge and omits standard and high-bitrate tiers.
_Avoid_: selected playback quality, membership level, a badge for every available tier

**Membership Status Badge**:
A single local VIP badge derived from `profile.vipType` in `/user/detail`. It states that a user has VIP status without implying a membership tier or using NetEase-provided level artwork.
_Avoid_: song pricing marker, playback restriction indicator, VIP tier, remote level icon

**Expired Music Session**:
The loss of a valid authenticated NetEase session while Scopify is running. It triggers a renderer-wide transition that clears session-bound state and returns the user to login.
_Avoid_: ordinary request failure, page error

**NetEase Session Credential**:
The opaque cookie bundle returned by NetEase authentication and required by authenticated backend endpoints. It is transport infrastructure, is never logged, and is not passed through component, hook, or business-API function signatures.
_Avoid_: bearer token, UI state, per-endpoint credential argument

**Session Credential Adapter**:
The Scopify-owned frontend boundary that retrieves, attaches, and clears a NetEase Session Credential for the immutable NetEase backend contract. It isolates runtime-specific Web and Electron storage from API functions and Query hooks.
_Avoid_: per-endpoint cookie handling, backend modification, component-level credential access
