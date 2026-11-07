# Folia Attribution

This directory is Scopify's lyric-presentation boundary. The complete, source-preserved Folia Playback Stage is vendored under `folia/`; Scopify-owned components around it form the Scopify Host Adapter.

- Project: https://github.com/chthollyphile/folia-major
- Revision: `0a3d0980ae81002b291617c819b308a2e6207b14`
- License: GNU Affero General Public License v3.0

Scopify retains ownership of NetEase session, queue, audio, cache, and API integration. The Scopify Host Adapter supplies Folia with lyrics, clocks, audio bands, metadata, themes, settings, and playback commands without creating a second player. Interface Gaps are tracked in the root README and must not be filled with simplified renderers or substitute UI.

Any copied or further adapted Folia module must keep the provenance in [`folia/SOURCE.md`](./folia/SOURCE.md) and the applicable AGPL notices.

## Layout

| Directory | What it holds |
| --- | --- |
| `stage/` | The stage shell: host, mount, presentation surface, store sync, visualizer prewarm, title navigator |
| `stagePanel/` | The side panel inside the stage: its tabs, quick controls, equalizer, personal FM matrix |
| `visualSettings/` | The visual settings dialog: host, sections, cards, preview, video export |
| `modeGallery/` | Style and background shelves, thumbnails and mode glyphs, shared by the panel and the dialog |
| `theme/` | Theme quick picker and record; `library/` for the workbench, `editor/` for editing, `transfer/` for JSON import and export |
| `lyricMatch/` | Matching a song to other lyrics: dialog, search, results, preview |
| `lyricOffset/` | The global lyric offset dialog and ruler |
| `visuals/` | Host-owned visuals, one directory each: `facet/`, `prisma/`, `rhine/` |
| `surfaces/` | Lyrics outside the stage: the center view, `subtitle/`, `island/`, `taskbar/`, and their shared `companion/` text |
| `folia/` | The vendored Folia source; `SOURCE.md` tracks every change to it |

New components go in the directory for their feature, not at this root.
