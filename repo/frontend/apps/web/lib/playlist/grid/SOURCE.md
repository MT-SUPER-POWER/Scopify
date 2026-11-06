# Grid source

Adapted from the Grid suite of [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) (`src/library/suites/grid`, `src/utils/hexCardFalloff.ts`).

- Hex layout follows `hexViewport.ts` (odd rows shifted by half a column), but the wall is endless: the playlist repeats along a stride, and only the cells inside the viewport are built, so there is no spiral and no ring lookup.
- The distance falloff (centre scale 1.1 down to 0.45, opacity down to 0.4, z-order by distance) keeps Folia's thresholds. It is applied by direct DOM writes on every camera frame, like Folia, and reuses Scopify's lattice camera for dragging, wheel, inertia and zoom. The falloff is measured in world pixels, so zooming magnifies the same picture.
- Not carried over: the library core, morph transitions between the home page and a collection, and the folia card editing actions. Cards use Scopify's playback commands and track data.
- Licensed under AGPL-3.0, as is Scopify; see the repository LICENSE.
