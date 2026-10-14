import type { SubtitleTrackRole } from "@/types/lyrics/folia/subtitleTrack";

/** Measured box of one subtitle row under Monet's active lyric (Folia 43f27c36). */
export interface MonetSubtitleTrackLayout {
  role: SubtitleTrackRole;
  text: string;
  fontPx: number;
  fontWeight: number;
  /** Visible rows after the per-track cap. */
  lineCount: number;
  lineHeightPx: number;
  contentHeightPx: number;
  paddingTopPx: number;
  paddingBottomPx: number;
  /** Reserved box height: content plus both paddings. */
  heightPx: number;
  isClipped: boolean;
}
