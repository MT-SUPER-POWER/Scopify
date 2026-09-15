import type { VisualizerBackgroundRenderProps } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";

export type RhineRhythmStyle = "legacy" | "wave" | "lift";
export type RhineQuality = "performance" | "original" | "high";
export interface RhineBackgroundTuning {
  colorMode: "auto" | "light" | "dark";
  quality: RhineQuality;
  rhythmStyle: RhineRhythmStyle;
  musicEnabled: boolean;
  breathingEnabled: boolean;
  strength: number;
  overlayOpacity: number;
  frameRate: "30" | "60";
}
export type RhineBackgroundProps = VisualizerBackgroundRenderProps;
export type RhineLoadState = "loading" | "ready" | "error";
export interface RhineAudioSample { low: number; mid: number; high: number; activity: number }
export interface RhineSceneInput {
  seed: string;
  dark: boolean;
  frozen: boolean;
  tuning: RhineBackgroundTuning;
}
export interface RhineQualitySettings {
  scale: number;
  pixelRatio: number;
  shadows: number;
  ao: number;
  antialias: boolean;
  transmissionScale: number;
}
