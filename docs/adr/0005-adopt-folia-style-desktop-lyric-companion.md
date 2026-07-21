# Adopt a Folia-style desktop lyric companion

Scopify's Desktop Lyric Window will adopt Folia's transparent companion-window interaction: persistent window behavior, interactive synchronized lyrics, background choices, transport commands, song liking, and lyric-stage controls. Video export is explicitly excluded from this lyric-presentation migration.

## Consequences

- The companion window receives a presentation snapshot from the main renderer and sends Desktop Lyric Commands back to the existing owners.
- It supports always-on-top, taskbar hiding, click-through, background selection, stage chrome controls, and main-window controls.
- Video recording, encoding, export presets, and file-writing IPC remain outside the product scope.
