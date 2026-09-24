import type { Theme } from "../../../components/lyrics/folia/src/types";
import type { SonnetGuideView } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/sonnetGuides";
import type { SonnetFrameDecorView } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/sonnetFrameDecor";
import type { SonnetSemanticSegment } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/types";
import type {
  SonnetSegmentRole,
  SonnetTypographyPlacement,
} from "../../../components/lyrics/folia/src/components/visualizer/sonnet/sonnetTypographyLayout";

// src/components/visualizer/sonnet/sonnetTextViewBuilder.ts
// Creates parser-timed core/halo glyph pairs and their semantic guide view.
export type PixiModule = typeof import("pixi.js");

export interface GlyphGhostView {
  node: import("pixi.js").Text;
  // Full-spread offset in wrapper-local px and the layer's peak alpha, both
  // precomputed so the runtime only scales by the envelope.
  dirX: number;
  dirY: number;
  alphaBase: number;
}

export interface GlyphView {
  display: import("pixi.js").Container;
  halo: import("pixi.js").Text | null;
  // Lives in the shot's shared aberration layer, not under `display`; the runtime copies the
  // wrapper's transform onto it each frame.
  caWrapper?: import("pixi.js").Container;
  caCyan?: import("pixi.js").Text;
  caRed?: import("pixi.js").Text;
  caOffset?: number;
  ghosts?: GlyphGhostView[];
  ghostDuration?: number;
  baseX: number;
  baseY: number;
  enterX: number;
  enterY: number;
  entryRotation: number;
  finalRotation: number;
  startTime: number;
  settleTime: number;
  zDepth: number;
  isBackgroundShape?: boolean;
  isTextGlyph?: boolean;
  updateAnimation?: (time: number) => void;
}

export interface SegmentView {
  segmentIndex: number;
  displayText: string;
  role: SonnetSegmentRole;
  fontScale: number;
  x: number;
  y: number;
  rotation: number;
  enterX: number;
  enterY: number;
  vertical: boolean;
  timingPhase: number;
  guide: SonnetGuideView;
  frameDecor?: SonnetFrameDecorView | null;
  glyphs: GlyphView[];
  trackingGlyphs: GlyphView[];
}

export interface SonnetTextViewOptions {
  segment: SonnetSemanticSegment;
  placement: SonnetTypographyPlacement;
  segmentIndex: number;
  baseFontSize: number;
  shotStartTime: number;
  shotEndTime: number;
  paragraphKind: string;
  width: number;
  fontFamily: string;
  fontWeight?: number | null;
  theme: Theme;
  glowEnabled: boolean;
  showFixedGeo: boolean;
  guideLayer: import("pixi.js").Container;
  haloLayer: import("pixi.js").Container;
  textLayer: import("pixi.js").Container;
  /** Child of `textLayer`, below every glyph wrapper; see sonnetSceneBuilder. */
  caLayer: import("pixi.js").Container;
}
