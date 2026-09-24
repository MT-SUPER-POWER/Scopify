import {
  PiArchive,
  PiTextAlignCenter,
  PiWaveform,
  PiStairs,
  PiStack,
  PiTextItalic,
  PiCirclesThree,
  PiFrameCorners,
  PiMetronome,
  PiMicrophoneStage,
  PiCube,
  PiFlower,
  PiTextT,
  PiSquaresFour,
  PiMusicNotes,
  PiSubtitles,
  PiSlidersHorizontal,
  PiPalette,
  PiBroadcast,
  PiTranslate,
  PiEye,
  PiTextAa,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import type { LyricVisualizerMode } from "@/types/lyrics";

export const FOLIA_VISUALIZER_ICONS: Record<LyricVisualizerMode, IconType> = {
  archive: PiArchive,
  classic: PiTextAlignCenter,
  cadenza: PiWaveform,
  partita: PiStairs,
  fume: PiStack,
  tilt: PiTextItalic,
  claddagh: PiCirclesThree,
  monet: PiFrameCorners,
  pendolo: PiMetronome,
  cappella: PiMicrophoneStage,
  diorama: PiCube,
  sonnet: PiFlower,
  still: PiTextT,
  tempera: PiSquaresFour,
};

const visualizerIconsByCommand = new Map(
  Object.entries(FOLIA_VISUALIZER_ICONS).map(([mode, icon]) => [`folia-mode-${mode}`, icon]),
);

export function getFoliaCommandIcon(id: string): IconType {
  if (id.startsWith("personal-fm")) return PiBroadcast;
  const visualizer = visualizerIconsByCommand.get(id);
  if (visualizer) return visualizer;
  if (id === "folia-visualizers") return PiSquaresFour;
  if (id === "folia-theme-library") return PiPalette;
  if (id === "folia-lyric-fonts") return PiTextAa;
  if (id === "folia-lyric-overlay") return PiEye;
  if (id.startsWith("folia-lyric-content-")) return PiTranslate;
  if (id.includes("subtitle") || id === "folia-lyric-details") return PiSubtitles;
  if (id.startsWith("folia-lyric")) return PiMusicNotes;
  return PiSlidersHorizontal;
}
