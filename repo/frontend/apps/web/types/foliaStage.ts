import type {
  AudioBands,
  LatentBackgroundTuning,
  Line,
  LyricData,
  MonetBackgroundTuning,
  NomandBackgroundTuning,
  SubtitleContentMode,
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
import type { FoliaStageAssets } from "@/types/foliaAssets";
import type { PlaybackPresentationTrack } from "@/types/playbackProjection";
import type { DesktopPlaybackWallpaperLayers } from "@scopify/desktop-contract";

export type FoliaStageEditSection = "background" | "common" | "subtitle" | "visualizer";
export type FoliaPanelTab = "controls" | "queue" | "settings";
export type FoliaThemeVariant = "dark" | "light";

export interface FoliaThemeColors {
  accentColor: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface FoliaQuickEffectPickerPosition {
  left: number;
  maxHeight: number;
  opensUpward: boolean;
  top: number;
  width: number;
}

export interface FoliaStageTheme {
  dark: FoliaThemeColors;
  id: string;
  light: FoliaThemeColors;
  name: string;
}

export interface FoliaStageSettings {
  animationIntensity: Theme["animationIntensity"];
  background: VisualizerBackgroundConfig;
  fontFamily: string | null;
  fontScale: number;
  fontStyle: Theme["fontStyle"];
  hideTranslationSubtitle: boolean;
  lyricOffsetMs: number;
  mode: LyricVisualizerMode;
  showSubtitleTranslation: boolean;
  sonnetPerformanceWarningDismissed: boolean;
  subtitleContentMode: SubtitleContentMode;
  subtitleFontFallbackFamilies: string[];
  subtitleFontFamily: string | null;
  subtitleFontInheritsLyrics: boolean;
  subtitleFontScale: number;
  subtitleFontStyle: Theme["fontStyle"];
  subtitleOverlayBackground: boolean;
  subtitleOverlayOpacity: number;
  themeId: string;
  themeRecentIds: string[];
  themes: FoliaStageTheme[];
  themeVariant: FoliaThemeVariant;
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
  pendingVisualizerMode: LyricVisualizerMode | null;
  requestVisualizerMode: (mode: LyricVisualizerMode) => void;
  resetAll: () => void;
  resetTheme: (id: string) => void;
  resetBackgroundTuning: (mode: VisualizerBackgroundMode) => void;
  resetTuning: (mode: VisualizerTuningMode) => void;
  sonnetPerformanceWarningDontShowAgain: boolean;
  sonnetPerformanceWarningOpen: boolean;
  cancelSonnetPerformanceWarning: () => void;
  confirmSonnetPerformanceWarning: () => void;
  setSonnetPerformanceWarningDontShowAgain: (enabled: boolean) => void;
  selectUrlBackground: (id: null | string) => void;
  setBackgroundMode: (mode: VisualizerBackgroundMode) => void;
  setThemeId: (id: string) => void;
  setThemeVariant: (variant: FoliaThemeVariant) => void;
  restoreBuiltinThemes: () => void;
  addTheme: (theme: FoliaStageTheme) => void;
  deleteTheme: (id: string) => void;
  updateUrlBackground: (id: string, patch: Partial<Omit<UrlBackgroundItem, "id">>) => void;
  updateTheme: (theme: FoliaStageTheme) => void;
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

export interface FoliaPresentationAppearance {
  assets: FoliaStageAssets;
  isDaylight: boolean;
  settings: FoliaStageStore;
  subtitleTheme: Theme;
  theme: Theme;
}

export interface FoliaPresentationSurfaceProps {
  appearance: FoliaPresentationAppearance;
  bridge: FoliaPlaybackBridge;
  isPlayerChromeHidden?: boolean;
  layers: DesktopPlaybackWallpaperLayers;
  onBack?: () => void;
  onLyricLineSeek?: (timeSeconds: number) => void;
  staticMode?: boolean;
  track: PlaybackPresentationTrack | null;
}
