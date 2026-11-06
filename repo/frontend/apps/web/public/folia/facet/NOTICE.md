# Facet background shaders

`scene.frag`, `bloom.frag` and `composite.frag` are an adaptation of **"Hex Glitch"** by **igneus**: https://www.shadertoy.com/view/lfscD7

Licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported** license (https://creativecommons.org/licenses/by-nc-sa/3.0/). This is Shadertoy's default license; the original shader declares no other. These three files stay under that license and are **not** covered by the repository's AGPL-3.0: they are separate resources that the application loads at runtime. Do not use them commercially.

## Changes from the original

- Rewritten for a real-time app background: fewer samples per pixel, fewer ripples, a capped internal resolution. Temporal accumulation stands in for the original's 25 samples.
- Colours come from the Scopify theme and the song's cover instead of black, white and a CIE spectrum.
- The full-screen black and white flip stays inside the hexagon, so lyrics stay readable.
- The fixed timer is gone: the hexagon turns on each lyric line, ripples flow with loudness and kicks, the hexagon's size and strength follow the song, and screen tears are kept for loud onsets.
- Bloom is one downsampled pass and works on light themes too.
