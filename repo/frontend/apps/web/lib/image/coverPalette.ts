import type { Color } from "colorthief";

function smoothstep(minimum: number, maximum: number, value: number): number {
  const progress = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
  return progress * progress * (3 - 2 * progress);
}

/** Rank perceptual swatches by covered area, chroma, and lightness. */
export function pickCoverColor(palette: readonly Pick<Color, "proportion" | "hex" | "oklch">[]) {
  let bestScore = -Infinity;
  let bestColor = "";

  for (const swatch of palette) {
    const share = swatch.proportion;
    const { c, l } = swatch.oklch();
    // Attenuate tiny regions and retain a floor for neutral and very dark or light covers.
    const area = Math.sqrt(share) * (0.1 + 0.9 * smoothstep(0.004, 0.03, share));
    const chroma = 0.2 + 0.8 * smoothstep(0.02, 0.13, c);
    const lightness = 0.25 + 0.75 * Math.max(0, 1 - ((l - 0.62) / 0.42) ** 2);
    const score = area * chroma * lightness;

    if (score > bestScore) {
      bestScore = score;
      bestColor = swatch.hex();
    }
  }

  return bestColor;
}
