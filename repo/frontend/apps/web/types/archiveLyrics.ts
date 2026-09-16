import type { CSSProperties } from "react";
import type { MotionValue } from "framer-motion";
import type { Line, Word } from "@/components/lyrics/folia/src/types";

export interface ArchiveLyricMotionOptions {
  identity: string;
  paused: boolean;
  staticMode: boolean;
}

export interface ArchiveWordProps {
  word: Word;
  currentTime: MotionValue<number>;
}

export interface ArchiveLyricLineProps {
  line: Line;
  currentTime: MotionValue<number>;
  onSeek?: (timeSeconds: number) => void;
  seekLabel: string;
}

export interface ArchiveVisualizerStyle extends CSSProperties {
  "--archive-font-scale": number;
  "--archive-subtitle-scale": number;
}
