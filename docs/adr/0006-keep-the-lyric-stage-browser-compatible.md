# Keep the lyric stage browser-compatible

Scopify will run the Lyric Stage and complete Folia Visualizer Suite in both Web and Electron runtimes. Only the Desktop Lyric Window is Electron-specific because it depends on native window capabilities.

## Consequences

- Web users receive the same full-screen lyric modes and settings without Electron IPC.
- Desktop-only window controls are capability-gated and absent from the Web UI.
- Visualizers must tolerate browser GPU availability and render a non-WebGL fallback where required.
