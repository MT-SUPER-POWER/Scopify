import type { SonnetTuning, Theme } from "../../../components/lyrics/folia/src/types";
import type {
  SonnetParagraph,
  SonnetShot,
} from "../../../components/lyrics/folia/src/components/visualizer/sonnet/types";
import type { SegmentView } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/sonnetTextViewBuilder";
import type { SonnetGlitchEffect } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/sonnetGlitchFilter";
import type { SonnetDebugShotInfo } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/sonnetDebug";

// src/components/visualizer/sonnet/sonnetSceneBuilder.ts
// Builds one bounded paragraph scene; playback-time mutation remains in the runtime controller.
export type PixiModule = typeof import("pixi.js");

export interface ShotView {
  shot: SonnetShot;
  container: import("pixi.js").Container;
  segments: SegmentView[];
  debugInfo: SonnetDebugShotInfo;
  baseX: number;
  baseY: number;
  basePivotX: number;
  basePivotY: number;
  haloLayer: import("pixi.js").Container;
  mgLayer: import("pixi.js").Container;
  mgBackgroundLayer?: import("pixi.js").Container;
  mgGeoLayer?: import("pixi.js").Container;
  mgParticleLayer?: import("pixi.js").Container;
  mgFixedGeoLayer?: import("pixi.js").Container;
}

export interface SceneView {
  paragraph: SonnetParagraph;
  container: import("pixi.js").Container;
  shots: ShotView[];
  shotTimeline: SonnetShot[];
  postProcessFilters: import("pixi.js").Filter[];
  transitionBlurFilter: import("pixi.js").BlurFilter | null;
  transitionGlitchEffect: SonnetGlitchEffect | null;
  activeShotIndex: number;
}

export interface SonnetSceneBuildOptions {
  programSeed: string;
  host: HTMLDivElement;
  theme: Theme;
  tuning: SonnetTuning;
  lyricsFontScale: number;
  staticMode: boolean;
  transparentBackground: boolean;
}
