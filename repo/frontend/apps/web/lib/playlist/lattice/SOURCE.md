# Lattice source

Adapted from [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major)
at v0.7.8, commit 9cf822015328e47ee5e22061213010a70b4ec5c9.

- Geometry: `src/components/app/lattice/{layout,blockTemplates,blockReflows}.ts`.
  Exact-cover expansion tables and repeating block layout are preserved.
- Browsing: `useWallPointerPan`, `useWallCameraPan`, `wallNavigation`.
  Direct DOM camera transforms, edge-triggered culling, drag inertia and spatial focus
  are adapted to Scopify's right content pane.
- Lyrics: `src/components/app/lattice/lyrics/` and `monetLyricMotion.ts`.
  The Pixi scene, shaders, typography, timeline and resource lifecycle are preserved.
  Types and hooks live in Scopify's global domain directories. Existing Folia/Monet
  helpers are reused. Local shaders explicitly use highp in both stages instead of
  changing Pixi's global shader defaults. Runtime reuse is keyed by the playback
  projection store, which survives poster changes.
- Scopify supplies page tracks, the unified playback transport, lyric projection,
  saved theme/font settings and navigation. Header, sidebar and Playbar remain owned
  by the host layout. Expanded controls use Scopify's playback actions.
- Licensed under AGPL-3.0, as is Scopify; see the repository LICENSE.
