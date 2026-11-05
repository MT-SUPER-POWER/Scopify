# Bravais source

Adapted from the Bravais suite of [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) (`src/library/suites/bravais`, `src/components/wall/seamPlan.ts`).

- Idea kept: a poster wall that splits open along a block boundary, with the page's information and actions in the gap. The seam only opens on a block boundary, so no tile is cut. When the camera comes to rest away from the seam, the seam closes and opens again at the boundary nearest the middle of the pane, and the camera yields the least distance that keeps the whole seam on screen.
- Wall: Scopify's Lattice block layout (`lib/playlist/lattice/layout.ts`, 12 x 8 blocks with exact-cover templates), laid out once over the page's tracks instead of repeating endlessly. Seats past the last song stay empty.
- Not carried over: Folia's wall engine, library core, layer store, card flip transitions, and the multi-level seam navigation. The seam here holds the page title, a filter, the focused song and the song list; tiles select on click and play on double click, through Scopify's playback commands.
- Licensed under AGPL-3.0, as is Scopify; see the repository LICENSE.
