import { parseColorChannels } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import type { Theme } from "@/components/lyrics/folia/src/types";
import type { FacetPalette } from "@/types/lyrics/facet/background";

// lib/lyrics/facet/palette.ts
// The page and ink come from the theme, so the image sits in the same light or dark as the lyrics on it.
// The colour fringes come from the cover when it has been read, otherwise from the theme.

const INK_STRENGTH = 0.8;

const channels = (color: string, fallback: readonly number[]) => {
  const parsed = parseColorChannels(color);
  return parsed ? [parsed.r / 255, parsed.g / 255, parsed.b / 255] : [...fallback];
};

export function resolveFacetPalette(theme: Theme, coverColors: readonly string[]): FacetPalette {
  const paper = channels(theme.backgroundColor, [0, 0, 0]);
  const primary = channels(theme.primaryColor, [1, 1, 1]);
  return {
    paper,
    ink: paper.map((value, index) => value + ((primary[index] ?? value) - value) * INK_STRENGTH),
    accent: channels(coverColors[0] ?? theme.accentColor, primary),
    secondary: channels(coverColors[1] ?? theme.secondaryColor, primary),
  };
}
