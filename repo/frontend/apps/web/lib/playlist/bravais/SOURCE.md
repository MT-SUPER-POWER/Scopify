# Bravais source

Adapted from the Bravais suite of [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) (`src/library/suites/bravais`, `src/components/wall/seamPlan.ts`).

- Idea kept: a poster wall with the page's information and actions in the middle of it.
- Changed: Folia's wall splits open along a block boundary and the panel rides the world in that gap, so it can be dragged out of view. Here the panel is pinned to the middle of the pane and the wall slides behind it; a selected tile is brought out beside the panel.
- Wall: Scopify's Lattice block layout (`lib/playlist/lattice/layout.ts`, 12 x 8 blocks with exact-cover templates), repeating endlessly in every direction like Lattice.
- Not carried over: Folia's wall engine, library core, layer store, card flip transitions, seam opening and the multi-level seam navigation. The panel holds the page title, a filter and the song list; tiles select on click and play on double click, through Scopify's playback commands.
- Licensed under AGPL-3.0, as is Scopify; see the repository LICENSE.
