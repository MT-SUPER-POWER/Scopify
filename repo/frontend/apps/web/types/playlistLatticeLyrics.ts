import type { createLatticeSweepShader } from "@/lib/playlist/lattice/lyrics/latticeLyricFilters";
import type { Texture, Mesh, MeshGeometry, Shader, Sprite } from "pixi.js";
import type { VisualizerSharedProps } from "@/components/lyrics/folia/src/components/visualizer/definition";
import type {
  MonetVisibleLineEntry,
  MonetDisplayToken,
} from "@/components/lyrics/folia/src/components/visualizer/monet/monetLyricsModel";
import type {
  resolveLatticeTypography,
  layoutLatticeLine,
} from "@/lib/playlist/lattice/lyrics/latticeLyricLayout";
import type { createLatticeRaster } from "@/lib/playlist/lattice/lyrics/latticeLyricRaster";
import type { createLatticeLineView } from "@/lib/playlist/lattice/lyrics/latticeLyricScene";

export interface Track {
  view: LatticeLineView;
  y: number;
  vy: number;
  scale: number;
  vs: number;
  alpha: number;
  blur: number;
  fromAlpha: number;
  fromBlur: number;
  elapsed: number;
  status: MonetVisibleLineEntry["status"];
  offset: number;
  leaving: boolean;
}

export type Pixi = typeof import("pixi.js");

export type LatticeSweep = ReturnType<typeof createLatticeSweepShader>;

export type MeasureText = (text: string, font: string) => { width: number; height: number };

export type LatticeTypography = ReturnType<typeof resolveLatticeTypography>;

export interface LyricPiece {
  text: string;
  x: number;
  y: number;
  width: number;
  row: number;
  token: MonetDisplayToken;
  offsets: number[];
  tokenOffset: number;
  translation: boolean;
}

export type LatticeLineLayout = ReturnType<typeof layoutLatticeLine>;

export type LatticeRaster = ReturnType<typeof createLatticeRaster>;

export interface PieceView {
  sprite: Mesh<MeshGeometry, Shader>;
  glow: Sprite[];
  texture: Texture;
  sweep: LatticeSweep;
  pad: number;
  width: number;
  height: number;
  piece: LyricPiece;
  color: string;
  base: number[];
}

export type LatticeLineView = ReturnType<typeof createLatticeLineView>;

export type ParkedRuntime = { runtime: LatticeLyricRuntime; timer: ReturnType<typeof setTimeout> };

export type LatticeLyricSource = Pick<
  VisualizerSharedProps,
  | "currentTime"
  | "currentLineIndex"
  | "lines"
  | "theme"
  | "subtitleTheme"
  | "showSubtitleTranslation"
  | "hideTranslationSubtitle"
  | "subtitleContentMode"
  | "paused"
  | "staticMode"
>;

export type LatticeLyricInput = LatticeLyricSource & {
  songKey: string;
  keywordColoringEnabled: boolean;
  reducedMotion: boolean;
  fontsEpoch: number;
};

export interface LatticeLyricRuntime {
  attach(host: HTMLElement): void;
  setErrorHandler(handler: (error: unknown) => void): void;
  update(input: LatticeLyricInput): void;
  /** CSS-pixel box of the host and the screen density it is shown at; a change of either rebuilds the scene. */
  resize(width: number, height: number, devicePixelRatio: number): void;
  setVisible(visible: boolean): void;
  destroy(): void;
}
