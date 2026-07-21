# Replace the legacy lyric modal with the lyric stage

Scopify's existing player-bar lyrics action will open the Folia-derived Lyric Stage and the legacy Lyric Modal will be removed from the active runtime path. This keeps a single familiar entry point while replacing the former LRC-only display with the complete visualizer experience.

## Consequences

- Existing player-bar, keyboard, close, and playback-control flows remain the entry and exit contract for lyrics.
- The old two-column cover-and-LRC surface is retired rather than maintained beside the Lyric Stage.
- Web and Electron open the same Lyric Stage; Electron additionally exposes the Desktop Lyric Window.
