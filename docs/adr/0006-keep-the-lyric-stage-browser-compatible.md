# Keep the lyric stage browser-compatible

Scopify will run the complete Folia Playback Stage in both Web and Electron runtimes through the same Scopify Host Adapter. Only the Desktop Lyric Window is Electron-specific because it depends on native window capabilities.

## Consequences

- Web users receive the same complete Playback Stage, visualizer/background registries, controls, and settings without Electron IPC.
- Desktop-only window controls are capability-gated and absent from the Web UI.
- WebGL and Canvas modes retain their upstream rendering paths. Platform capability handling may use an upstream-defined fallback or explicitly disable an unavailable capability, but it must not replace the mode with a simplified renderer.
