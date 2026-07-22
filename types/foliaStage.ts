import type {
  AudioBands,
  LatentBackgroundTuning,
  Line,
  LyricData,
  MonetBackgroundTuning,
  NomandBackgroundTuning,
  Theme,
  UrlBackgroundItem,
  VisualizerBackgroundMode,
} from "@/components/lyrics/folia/src/types";
import type { MotionValue } from "framer-motion";
import type { VisualizerBackgroundConfig } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";
import type {
  VisualizerTuningBundle,
  VisualizerTuningMap,
  VisualizerTuningMode,
} from "@/components/lyrics/folia/src/components/visualizer/tuningRegistry";
import type { LyricVisualizerMode } from "@/types/lyrics";

export type FoliaStageEditSection = "background" | "common" | "subtitle" | "visualizer";
export type FoliaPanelTab = "controls" | "lyrics" | "queue";

export interface FoliaStageSettings {
  background: VisualizerBackgroundConfig;
  fontFamily: string | null;
  fontScale: number;
  fontStyle: Theme["fontStyle"];
  hideTranslationSubtitle: boolean;
  lyricOffsetMs: number;
  mode: LyricVisualizerMode;
  showSubtitleTranslation: boolean;
  subtitleFontFallbackFamilies: string[];
  subtitleFontFamily: string | null;
  subtitleFontInheritsLyrics: boolean;
  subtitleFontStyle: Theme["fontStyle"];
  subtitleOverlayBackground: boolean;
  subtitleOverlayOpacity: number;
  tunings: VisualizerTuningBundle;
  visualizerOpacity: number;
}

export interface FoliaStageStore extends FoliaStageSettings {
  addUrlBackground: (item: UrlBackgroundItem) => void;
  deleteUrlBackground: (id: string) => void;
  patchBackgroundCommon: (patch: NonNullable<VisualizerBackgroundConfig["common"]>) => void;
  patchLatentBackground: (patch: Partial<LatentBackgroundTuning>) => void;
  patchMonetBackground: (patch: Partial<MonetBackgroundTuning>) => void;
  patchNomandBackground: (patch: Partial<NomandBackgroundTuning>) => void;
  patchSettings: (patch: Partial<FoliaStageSettings>) => void;
  patchTuning: <Mode extends VisualizerTuningMode>(
    mode: Mode,
    patch: Partial<VisualizerTuningMap[Mode]>,
  ) => void;
  replaceSettings: (settings: FoliaStageSettings) => void;
  resetAll: () => void;
  resetBackgroundTuning: (mode: VisualizerBackgroundMode) => void;
  resetTuning: (mode: VisualizerTuningMode) => void;
  selectUrlBackground: (id: null | string) => void;
  setBackgroundMode: (mode: VisualizerBackgroundMode) => void;
  updateUrlBackground: (id: string, patch: Partial<Omit<UrlBackgroundItem, "id">>) => void;
}

export interface FoliaPlaybackBridge {
  audioBands: AudioBands;
  audioPower: MotionValue<number>;
  currentLineIndex: number;
  currentTime: MotionValue<number>;
  durationSeconds: number;
  isPlaying: boolean;
  lines: Line[];
  lyricCurrentTime: MotionValue<number>;
  lyrics: LyricData | null;
}
