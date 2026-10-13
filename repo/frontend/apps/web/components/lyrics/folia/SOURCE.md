# Folia source snapshot

This directory vendors the playback-stage presentation runtime from
[`chthollyphile/folia-major`](https://github.com/chthollyphile/folia-major) at
commit `0a3d0980ae81002b291617c819b308a2e6207b14` (2026-07-22).

Selected upstream presentation updates are reviewed and recorded separately from
the original full-copy baseline:

- `55e67e13e79a8b183de038557e002a1bf4ce228e` — correct Nomand image sampling
  direction for daylight generated-color themes.
- `a41e20e85b19f0c4438f0ce79e529952300229f8` — add Pendolo chorus emphasis and
  animation-intensity motion profiles.
- `c3d0f9a96999615499d326139601be7e39d6a483` — add the complete Sonnet / 商籁
  Pixi lyric-PV visualizer, tuning panel, and performance guidance from Folia
  v0.6.10.
- `ed7b29732168a95e821cd6f149a3fefd8bb3e54e` — measure Cappella message height
  from the actual wrapped lyric bubble and reserve a safe lower viewport area.
- `bb70a1c` through `40f0d13` — update Sonnet to the reviewed v2 layout and
  camera pipeline, including ShotFlow, poster blocks, semi-hero typography and
  artifacts, measured frame decoration, deterministic camera tracking, expanded
  MG scenes, and fixed-geometry growth.
- `5d61d77` through `2a181f9` — add the opt-in Sonnet full-scene post-process
  pipeline from Folia v0.6.15, including film grain, contrast, corrected RGB
  shift, halftone, vignette, lens distortion and chromatic dispersion. The
  reviewed final defaults keep the pipeline disabled until the user enables it.
- `a0481ff`, `c939b1d`, `0b98951`, `581b7a0`, `3a36230`, and `d71d949` — add
  translation / romanization / hidden subtitle modes, independent subtitle
  scaling, the theme-aware fading subtitle backdrop, the iOS compositing fix,
  and complete Sonnet subtitle-settings wiring.
- `40d31e906af97e08cbeb113c80feb5c83b69fd05` — make Sonnet preserve its designed
  role hierarchy in automatic mode while honoring the Lyric Stage theme's
  manual global font-weight override from Folia v0.6.16.
- `47d5eaad` through `b68fa68e` — backport Monet's v0.7 correctness fixes for
  atomic token measurement, late web-font invalidation, container-aware sizing,
  active-line height, long-glyph sweep clipping, and Blob portrait replacement.
- `19e120e8` and `2cefc8fc` — preserve Sonnet transparency and release retained
  Pixi display resources when cached scenes leave the visible set.
- `35de348f` and `37cb1a4d` — adapt the v0.7 Electron export fixes to Scopify's
  Desktop Contract: current-display DPI sizing, Canvas crop output, capture
  cleanup, and exact restoration of window bounds and presentation state.
- `34e6d2258225610a178dde6ed1c406b699336c8a` — review Folia v0.7.0 and add the
  complete Tempera / 凝彩 Pixi visualizer, user image pool, Still mode, and the
  shared Pixi resource-lifecycle helper required by the new renderer set.

- `c3d689186682e91fba42167dd511518867c73981` — group Sonnet chromatic-aberration
  copies in one shared layer, synchronizing glyph transforms without alternating
  screen/normal blend modes for each glyph. Touched runtime/view types live in
  Scopify's `types/lyrics/folia`, with compatibility type exports at vendor paths.

- `8653101223a785cc05b90d772817615e5d51c323` — retain Monet's portrait frame and
  decode new covers before bounded layered crossfades. Host hook, helper and types
  live under Scopify's lyrics domain directories.

- `a36efc1d` and `57d3f806` — reserve Monet header width for portrait bleed
  and drag offset; clamp long titles without clipping accents or descenders.

- `8764ab2781ce50de24d8af608967fab2a82e1b4e` — bound Pendolo's clockwork
  canvas to its visible content rather than the whole viewport; keep canvas props
  in Scopify's lyrics-domain types.

- `1220c0eb` — snap Sonnet and Tempera renderer resolution to a smaller
  Pixi texture-pool bucket when the resolution reduction stays within 25%;
  align Tempera filter-pass resolutions and keep shared helpers/types in
  Scopify's lyrics-domain directories.

- `a69dd947b9e0679685f0a243434060ec15c96781` (measurement portion) —
  share bounded text-width caches across Sonnet and Tempera layout calls;
  preserve local typography and keep measurement types in the lyrics domain.

- `a69dd947b9e0679685f0a243434060ec15c96781` (Sonnet handover portion) —
  retain the Pixi application across songs, stage the next scene and pre-roll
  neighbours over separate frames. Shared host/song hooks live in Scopify's
  lyrics hooks; pure decisions and types live in their domain directories.
  Local adaptations isolate asynchronous drains by runtime lifetime, let paused
  dissolves settle, and compare complete lyric content rather than only the
  first line and line count.

- `a69dd947b9e0679685f0a243434060ec15c96781` and
  `b2fd832316783a7e58d07679c8fd31088f73a630` (Tempera handover portion) —
  retain the Pixi application and image textures across songs, stage the next
  scene before a direct cut, and release retired scenes over later frames.
  Local adaptations settle a pending cut when paused and continue retiring
  scenes when the new program has no paragraphs.

- `d9e3efaa` — Tempera whole-line lyrics: one shot per source line, decor drawn from
  the rest of the song instead of echoing the line on screen. The program options type
  lives in Scopify's `types/lyrics/folia/temperaProgram.ts`.

- `3e081df8`, `2bd16cbc` and `acf7ffc9` (as of v0.7.18) — Tempera canvas-image pool zip
  backup with append / replace import, all-or-nothing rollback, the 512 MB declared-size
  guard and the dialog close lock. The archive services keep Folia's `services/` paths over
  Scopify's asset store; the draft and file actions live in `hooks/lyrics/useTemperaImagePool.ts`,
  shared types in `types/lyrics/folia/temperaImagePool.ts`, and the download helpers in
  `lib/web/download.ts`. Local adaptations: results are reported through Scopify's toasts,
  replacing a non-empty pool is confirmed inside the import menu instead of `window.confirm`,
  and the dialog keeps Scopify's existing styling rather than Folia's daylight tokens.

- `90a30fba` — Monet audio-visualization toggle. A tuning without the field still shows the
  spectrum, so older themes and other hosts are unaffected.

- `f1e4f577` and `a2874584` — the stage pointer hides with the auto-hidden player chrome and
  every interaction (move, press, wheel) reveals both; a held pointer keeps the chrome up. The
  opt-out is the stage setting `autoHideCursorWithChrome`, and the cursor scope is the visual
  layer in `LyricStage`, so controls and dialogs keep their pointer.

- `2bd643a8` — raise Pixi's default fragment precision to highp before any program compiles.
  The loader is Scopify's shared `lib/lyrics/folia/loadPixi.ts`, used by Sonnet, Tempera and
  Lattice; Pixi 8.19 already supports the option, so no dependency bump was needed.

- `66119721` — destroy Pixi display trees node by node so each Graphics releases its own
  GraphicsContext and GPU buffers, and unload those contexts with the views. Sonnet and Tempera
  scenes, overlays and credits use it; Lattice's quad deletes its buffers on destroy.

- `2a7cd5e0` — Sonnet's arc gauge moves to each arc's start point before drawing, removing the
  stray extra ring and connector.

- `65f8a59f` and `161756cb` — Latent's paper shaders run without MSAA or a depth buffer and lose
  their WebGL context once the canvas leaves the document. The helper lives in Scopify's
  `lib/lyrics/folia/paperShaderContext.ts`.

- `62dceafd` — Sonnet applies settings through `setTuning` on the live runtime; only
  `textureResolution`, `showOnlyText` and `showBackgroundDecor` stay in the host's rebuild key.

- `75804bfa` — Sonnet skips redrawing AnimatedGraphics, the open frame and empty guide layers
  while their clamped progress is unchanged, caches each shot's tracking data in a WeakMap, and
  reads the fitted renderer size instead of the host's layout each frame.

- `68e3360c` and `21957740` — Sonnet's AnimatedGraphics skips commands still waiting for
  their stagger window unless an arc-led neighbour depends on the shared path; transition
  filters are pinned to the viewport so they no longer follow the drawn-in bounds.

The copied source remains licensed under AGPL-3.0. See [LICENSE](./LICENSE).
Scopify is also distributed under AGPL-3.0.

## Included

- all thirteen registered lyric visualizers and their tuning panels
- all six registered visualizer backgrounds and their settings panels
- shared renderer, shell, subtitle, timing, font, color, and lyric helpers
- Folia's top-level theme CSS-variable builder (`buildAppStyle.ts`)
- Cappella built-in avatar and emoji assets
- Folia floating playback controls, progress bar, and chrome auto-hide hook
- Folia i18n initialization and locale dictionaries

## Host adaptations

- Vite `import.meta.glob` registries are explicit static registries containing
  the same pinned entries, tunings, and assets so Next.js can bundle them.
- Vite development checks use `process.env.NODE_ENV`.
- Browser-only chrome preference reads are guarded during Next.js server rendering.
- Folia's visualizer overlay scrollbar rules live in Scopify's global stylesheet
  because Next.js owns global CSS loading.
- Scrollable Folia settings and timeline panes use that shared overlay class so
  the pinned 6px translucent scrollbar also works in the host shell.
- The preview-only native-blur warning no longer reads Folia's application-wide
  settings store. Renderer and settings behavior is otherwise unchanged.
- The common Visual Settings panel accepts an optional host theme-control slot;
  Scopify supplies its Lyric Stage Theme Library there while preserving Folia's
  original preset control as the fallback.
- Locale dictionaries include host labels for the Lyric Stage-only Theme Library.
- Scopify supplies lyrics, playback time, audio bands, metadata, and transport
  callbacks through a separate adapter outside this directory.
- Scopify exposes Nomand's daylight sampling rule through a small pure helper so
  the host can regression-test light and dark behavior without mounting WebGL.
- Sonnet keeps Folia's lazy Pixi v8 runtime and full scene/tuning implementation;
  Scopify adapts its i18n keys, persists its tuning bundle, and owns the one-time
  performance-warning dialog at the host boundary.
- Tempera keeps Folia's lazy Pixi runtime and deterministic composition engine;
  Scopify persists image blobs in the existing `scopify-folia-stage` asset store
  and keeps only normalized placement descriptors in the synced tuning bundle.

`.vendor-closure.ps1` records and reproduces the source dependency closure. Any
upstream refresh must record the reviewed commit above and review every host
adaptation against that snapshot.
