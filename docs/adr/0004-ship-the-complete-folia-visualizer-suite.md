# Ship the complete Folia visualizer suite

Scopify will adopt the complete Folia Visualizer Suite at the selected source revision, rather than launch with only a subset of lyric modes. The lyric-presentation migration therefore includes every registered mode, its settings panel, and the dependencies needed for its intended visual behavior.

## Consequences

- The migration covers Classic, Cadenza, Partita, Fume, Monet, Claddagh, Cappella, Tilt, and Diorama together.
- WebGL, Canvas, asset, and performance requirements are part of the release scope, not deferred enhancements.
- The Visualizer Registry remains the single place to discover and select all supported modes.
