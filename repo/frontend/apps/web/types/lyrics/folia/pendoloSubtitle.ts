import type { SubtitleContentMode } from "@/components/lyrics/folia/src/types";
import type { SubtitleTrackRole } from "@/types/lyrics/folia/subtitleTrack";

/** One subtitle row under a Pendolo lyric, sized for its focal state (Folia 5809e8e8). */
export interface PendoloSubtitleTrackSpec {
  role: SubtitleTrackRole;
  text: string;
  fontPx: number;
  lineHeightPx: number;
  fontWeight: number;
  /** Space above this row in em of its own font size (the first row sits against the lyric). */
  gapEm: number;
  /** Opacity multiplier laid over the row's own colour; 1 for the first row. */
  opacityFactor: number;
}

export interface PendoloSubtitleTrackOptions {
  mode: SubtitleContentMode;
  hidden: boolean;
  /** Focal rows are drawn larger than the ones waiting on the wheel. */
  focal: boolean;
  fontScale: number;
}
