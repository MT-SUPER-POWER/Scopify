# Facet background shaders

`scene.frag`, `bloom.frag` and `composite.frag` are an adaptation of **"Hex Glitch"** by **igneus**: https://www.shadertoy.com/view/lfscD7

Licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported** license (https://creativecommons.org/licenses/by-nc-sa/3.0/). This is Shadertoy's default license; the original shader declares no other. These three files stay under that license and are **not** covered by the repository's AGPL-3.0: they are separate resources that the application loads at runtime. Do not use them commercially.

## Changes from the original

- Rewritten for a real-time app background: fewer samples per pixel, fewer ripples, a capped internal resolution. Temporal accumulation stands in for the original's 25 samples.
- The subject is new: a window of hexagonal facets refracting the song's blurred cover, in place of the original's monochrome hexagon, on the Scopify theme's colours instead of black, white and a CIE spectrum. Its lattice and ripple field remain.
- The black and white inversion, the cells re-rolled several times per cycle and the shattering kick are gone, and no pixel may change faster than a set rate.
- The image softens where lyrics usually sit.
- The fixed timer is gone. Each sung word lights a facet, a new line and each kick send a ring of light outward, and the chorus opens the facets across the screen and rotates them a sixth of a turn. Screen tears are limited to the chorus entry, faintly, and to the highest animation intensity.
- Bloom is one downsampled pass and works on light themes too.
