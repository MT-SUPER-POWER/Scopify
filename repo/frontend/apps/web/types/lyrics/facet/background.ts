import type { VisualizerBackgroundRenderProps } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";

export type FacetQuality = "performance" | "balanced" | "high";
export interface FacetBackgroundTuning {
  quality: FacetQuality;
  musicEnabled: boolean;
  strength: number;
  overlayOpacity: number;
  frameRate: "30" | "60";
}
export type FacetIntensity = "calm" | "normal" | "chaotic";
export type FacetBackgroundProps = VisualizerBackgroundRenderProps;
export type FacetLoadState = "loading" | "ready" | "error";
export interface FacetQualitySettings {
  /** Upper limit on the internal buffer, whatever the display's size and pixel ratio. */
  maxPixels: number;
  samples: number;
  turns: number;
  ripples: number;
  bloom: boolean;
}
export interface FacetPalette {
  paper: number[];
  ink: number[];
  accent: number[];
  secondary: number[];
}
export interface FacetAudioSample {
  low: number;
  mid: number;
  high: number;
  spectrum?: ArrayLike<number>;
}
/** Where the singing is, from the stage's lyric clock. */
export interface FacetLyricSample {
  /** The current line, or -1 before the first one. */
  lineIndex: number;
  /** How far through the current line, 0 to 1. */
  progress: number;
  /** Whether the current line is still being sung, as opposed to the gap after it. */
  singing: boolean;
}
/** What the song did to the motion since the last report. */
export interface FacetMotionStats {
  kicks: number;
  turns: number;
  tears: number;
  energy: number;
  samples: number;
}
export interface FacetTear {
  y: number;
  height: number;
  shiftX: number;
  shiftY: number;
}
/** What the shaders need for one frame, apart from the palette and the quality settings. */
export interface FacetMotionFrame {
  flow: number;
  tick: number;
  /** The hexagon's rotation as a share of a full circle. It rests on sixths, where a hexagon looks the same. */
  blend: number;
  scale: number;
  presence: number;
  thickness: number;
  grain: number;
  burst: number;
  tear: FacetTear | null;
}
export interface FacetSceneInput {
  seed: string;
  palette: FacetPalette;
  tuning: FacetBackgroundTuning;
  intensity: FacetIntensity;
  frozen: boolean;
  still: boolean;
  vignette: boolean;
}
export interface FacetShaderSources {
  scene: string;
  bloom: string;
  composite: string;
}
export interface FacetRenderOptions {
  motion: FacetMotionFrame;
  palette: FacetPalette;
  quality: FacetQualitySettings;
  seed: number;
  historyWeight: number;
  /** The most any pixel may change this frame. */
  maxDelta: number;
  samples: number;
  vignette: boolean;
}
