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
The immutable Folia source revision from which Scopify adapts lyric-presentation code. The selected snapshot is `4f050885630183c04f7eda946300f6f96988ae0f`.
_Avoid_: floating main branch, untracked copy

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
A browser-compatible full-screen host for a selected Visualizer Mode. It is available in both Scopify's Web and Electron runtimes and is opened from Scopify's existing lyrics action.
_Avoid_: desktop window, player

**Legacy Lyric Modal**:
The former Scopify full-screen LRC surface. It is replaced by the Lyric Stage and has no active runtime path after the migration.
_Avoid_: Lyric Stage, supported lyric renderer

**Folia Visualizer Suite**:
The complete set of Visualizer Modes registered by Folia at the selected source revision, together with their settings panels and rendering dependencies. Scopify ships the suite as one lyric-presentation capability rather than a limited starter subset.
_Avoid_: starter modes, optional later work

**Raw NetEase Lyric**:
The complete lyric source supplied for a track by NetEase, including plain and word-timed text, translations, romanizations, and attribution. It is the source material for a Lyric Presentation Subsystem rather than a display-ready lyric document.
_Avoid_: clipped lyric, LRC-only lyric

**AI Lyric Theme**:
An optional user-configured generator that derives visual parameters from a song's lyrics and cover. It is not required for the Lyric Stage or Folia Visualizer Suite.
_Avoid_: default theme, required visualizer feature

## State Ownership

**Remote Music Data**:
Data obtained from the NetEase backend, including music catalog, recommendations, playlists, albums, artists, comments, search results, and user profile data. It has a cache and lifecycle owned by the query layer.
_Avoid_: Zustand data, page state

**Renderer State**:
Local state that describes the Scopify renderer itself, including playback, UI preferences, dialogs, and the authenticated-session snapshot. It is owned by Zustand or component state.
_Avoid_: Remote Music Data, backend cache

**Persistent Music Cache**:
The selected subset of Remote Music Data retained across Scopify restarts for fast return visits. It is a persisted portion of the query cache rather than a separate page cache.
_Avoid_: pageCache, duplicate cache

**Account-Scoped Music Data**:
Remote Music Data whose meaning depends on the authenticated Scopify user, including profiles, libraries, daily recommendations, and comments. It is removed when the authenticated account changes.
_Avoid_: public catalog data, shared cache

**Expired Music Session**:
The loss of a valid authenticated NetEase session while Scopify is running. It triggers a renderer-wide transition that clears session-bound state and returns the user to login.
_Avoid_: ordinary request failure, page error
