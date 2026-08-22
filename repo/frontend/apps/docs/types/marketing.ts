import type { MotionValue } from "framer-motion";

import type { AudioBands, Line } from "@folia/types";

export interface FoliaFluidTheme {
  accentColor: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
}

export type FoliaLatentDisplayMode = "dithering" | "mesh" | "both";
export type FoliaLatentColorSource = "cover-theme" | "cover-only";

export interface FoliaLatentTuning {
  colorSource: FoliaLatentColorSource;
  displayMode: FoliaLatentDisplayMode;
  ditheringAudioSpeed: number;
  ditheringOpacity: number;
  ditheringSize: number;
  ditheringSpeed: number;
  dynamicOnlyInPlayer: boolean;
  enhancedBeatResponse: boolean;
  meshAudioSpeed: number;
  meshDistortion: number;
  meshSpeed: number;
  meshSwirl: number;
  overlayEnabled: boolean;
  overlayOpacity: number;
}

export type LandingScene = "intro" | "performance" | "fragments" | "interface" | "epilogue";

export interface LandingSonnetTimeline {
  audioBands: AudioBands;
  audioPower: MotionValue<number>;
  currentLineIndex: number;
  currentTime: MotionValue<number>;
  lines: Line[];
}
