# Folia source snapshot

This directory vendors the playback-stage presentation runtime from
[`chthollyphile/folia-major`](https://github.com/chthollyphile/folia-major) at
commit `0a3d0980ae81002b291617c819b308a2e6207b14` (2026-07-22).

The copied source remains licensed under AGPL-3.0. See [LICENSE](./LICENSE).
Scopify is also distributed under AGPL-3.0.

## Included

- all nine registered lyric visualizers and their tuning panels
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

`.vendor-closure.ps1` records and reproduces the source dependency closure. Any
upstream refresh must update the pinned commit above and review every host
adaptation against that new snapshot.
