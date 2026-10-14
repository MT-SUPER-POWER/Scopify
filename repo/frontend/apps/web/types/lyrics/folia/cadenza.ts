/** One Cadenza word's DOM state for a frame, as strings ready to assign (Folia 04b16c6e). */
export interface CadenzaOverlayWordFrame {
  outerTransform: string;
  font: string;
  innerTransform: string;
  text: string;
  color: string;
  opacity: string;
  filter: string;
}

/** A word placement's text split once per prepared line: graphemes, CJK flag, measured ascent. */
export interface CadenzaPlacementGlyphs {
  glyphs: string[];
  cjk: boolean;
  ascent?: number;
}

/** Where a Cadenza word stands against the clock; also its draw order (active words on top). */
export type CadenzaWordStatus = "waiting" | "passed" | "active";
