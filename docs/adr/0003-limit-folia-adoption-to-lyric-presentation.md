# Limit Folia adoption to lyric presentation

Scopify will retain its NetEase session, remote music data, playback queue, audio, and cache while replacing its lyric presentation with Folia-derived code. The adopted boundary includes lyric parsing, timing, immersive rendering, and the optional Desktop Lyric Window; it excludes playback and music-service ownership.

## Consequences

- Folia-derived surfaces consume Scopify playback state through an explicit adapter rather than own a second player state.
- Existing Scopify audio and queue behavior stays stable while lyric presentation is replaced incrementally.
- Electron IPC added for the Desktop Lyric Window is limited to window control and presentation state.
