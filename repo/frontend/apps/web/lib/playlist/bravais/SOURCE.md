# Bravais source

Named after the Bravais suite of [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) (`src/library/suites/bravais`, `src/components/wall/seamPlan.ts`).

- Idea kept: a poster wall split in two, with the page's information and actions in the split.
- Changed: Folia's wall splits along a block boundary and the panel rides the world in that gap, so it can be dragged out of view, and the wall is the same two-dimensional one Scopify's Lattice uses. Here the list is fixed in the middle of the pane and the two halves are separate columns that only scroll vertically, rolling against each other. Their blocks are sized from the pane, so tiles always end exactly at the list and the pane's edge, and every tile is square. Zooming changes how many blocks fit across.
- Not carried over: Folia's wall engine, library core, layer store, card flip transitions, seam opening and the multi-level seam navigation. The panel holds the page title, a filter and the song list; tiles select on click and play on double click, through Scopify's playback commands.
- Licensed under AGPL-3.0, as is Scopify; see the repository LICENSE.
