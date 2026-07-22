# Ship the complete Folia visualizer suite

Scopify will ship the complete Folia Playback Stage at the selected source revision, rather than launch with a subset or Folia-inspired approximation. The migration includes every registered visualizer and background, the shared renderer/shell/subtitle runtime, original playback controls and visual settings, built-in assets, and the dependencies needed for the intended responsive animation behavior.

## Consequences

- The migration covers Classic, Cadenza, Partita, Fume, Monet, Claddagh, Cappella, Tilt, and Diorama together.
- It also covers Common, Latent, Nomand, Monet, URL, and Sora backgrounds together with their available settings panels.
- FloatingPlayerControls, ProgressBar, the lyric timeline, chrome auto-hide, per-mode settings, background settings, and Cappella assets are part of the same Playback Stage scope.
- WebGL, Canvas, asset, and performance requirements are part of the release scope, not deferred enhancements.
- The Visualizer and Background Registries remain the discovery points for their complete pinned entry sets; no generic scene may stand in for an upstream mode.
