# Scopify

Scopify is a NetEase Cloud Music client whose renderer coordinates music data, playback, and user interactions across web and Electron runtimes.

## Language

**Folia**:
A source project whose lyric-rendering and desktop-lyric implementation may be adapted into Scopify. Folia remains a separate product and is not an integrated runtime component.
_Avoid_: external integration, Folia player

**Folia-derived code**:
Scopify code copied from or adapted from Folia under AGPL-3.0. It retains Folia's required copyright and license notices.
_Avoid_: independent implementation, runtime dependency

**Folia Source Snapshot**:
The immutable Folia source revision from which Scopify vendors lyric-presentation code. The selected snapshot is `0a3d0980ae81002b291617c819b308a2e6207b14`.
_Avoid_: floating main branch, untracked copy

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
