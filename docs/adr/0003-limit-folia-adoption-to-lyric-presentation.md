# Limit Folia adoption to lyric presentation

Scopify will retain its NetEase session, remote music data, playback queue, audio, and cache while replacing its lyric presentation with the complete Folia Playback Stage. The adopted boundary includes lyric parsing and timing, the source-preserved single-page stage, and the optional Desktop Lyric Window; it excludes playback and music-service ownership.

## Consequences

- Folia-derived surfaces consume Scopify playback state through the Scopify Host Adapter rather than own a second player state.
- The active lyric surface is replaced as one complete Playback Stage; simplified visualizers and a parallel legacy fallback are not part of the target architecture.
- Inputs, actions, or local resource capabilities that Scopify cannot yet supply are recorded as Interface Gaps instead of being approximated inside Folia-owned renderers.
- Electron IPC added for the Desktop Lyric Window is limited to window control and presentation state.
