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
  MG scenes, and fixed-geometry growth. The later full-scene post-process series
  beginning at `5d61d77` remains intentionally excluded.
- `a0481ff`, `c939b1d`, `0b98951`, `581b7a0`, `3a36230`, and `d71d949` — add
  translation / romanization / hidden subtitle modes, independent subtitle
  scaling, the theme-aware fading subtitle backdrop, the iOS compositing fix,
  and complete Sonnet subtitle-settings wiring.

The copied source remains licensed under AGPL-3.0. See [LICENSE](./LICENSE).
Scopify is also distributed under AGPL-3.0.

## Included

- all eleven registered lyric visualizers and their tuning panels
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

`.vendor-closure.ps1` records and reproduces the source dependency closure. Any
upstream refresh must record the reviewed commit above and review every host
adaptation against that snapshot.
