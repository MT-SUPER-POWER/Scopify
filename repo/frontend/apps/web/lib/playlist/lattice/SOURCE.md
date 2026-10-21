# Lattice source

Adapted from [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) at v0.7.8, commit 9cf822015328e47ee5e22061213010a70b4ec5c9.

- Geometry: `src/components/app/lattice/{layout,blockTemplates,blockReflows}.ts`. Exact-cover expansion tables and repeating block layout are preserved.
- Browsing: `useWallPointerPan`, `useWallCameraPan`, `wallNavigation`. Direct DOM camera transforms, edge-triggered culling, drag inertia and spatial focus are adapted to Scopify's right content pane.
- Lyrics: `src/components/app/lattice/lyrics/` and `monetLyricMotion.ts`. The Pixi scene, shaders, typography, timeline and resource lifecycle are preserved. Types and hooks live in Scopify's global domain directories. Existing Folia/Monet helpers are reused. Local shaders explicitly use highp in both stages; Pixi is loaded through the shared `lib/lyrics/folia/loadPixi.ts`, which also raises Pixi's default fragment precision as Folia's stage loader does. Runtime reuse is keyed by the playback projection store, which survives poster changes.
- Scopify supplies page tracks, the unified playback transport, lyric projection, saved theme/font settings and navigation. Header, sidebar and Playbar remain owned by the host layout. Expanded controls use Scopify's playback actions.
- Poster typography follows the title/artist hierarchy in `Lattice.css` and `lyrics/LatticeLyrics.css`, adapted to the narrower pane with two-line previews and smaller type on narrow tiles. Full titles remain available to assistive technology and on hover; fitting uses CSS without per-poster DOM measurement.
- Later fixes from Folia: `8aa7b132` (whole-number lyric resolution, so 125-175% scaling no longer softens glyphs), `2cb9e56e` and `194d0c4a` (glyph textures are built at resolution 1 before the real one is set, so fractional ratios no longer wipe whole lyric lines), and the Lattice part of `66119721` (the quad deletes its buffers on destroy).
- Licensed under AGPL-3.0, as is Scopify; see the repository LICENSE.
