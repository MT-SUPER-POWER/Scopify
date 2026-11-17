/** Which alternate text a subtitle row carries (Folia 871a7ba6). */
export type SubtitleTrackRole = "romanization" | "translation";

/** One subtitle row: single-source modes carry exactly one, the dual mode up to two. */
export interface SubtitleTrack {
  role: SubtitleTrackRole;
  text: string;
}

export type SubtitleOverlayFirstRow = "current" | SubtitleTrackRole;
export type SubtitleOverlayFollowRow = "next" | SubtitleTrackRole;
export type SubtitleOverlayRowSource = SubtitleOverlayFirstRow | SubtitleOverlayFollowRow;

type SubtitleOverlayRowsLayout =
  | "none"
  | SubtitleOverlayFirstRow
  | `${SubtitleOverlayFirstRow}+${SubtitleOverlayFollowRow}`
  | `${SubtitleOverlayFirstRow}+${SubtitleOverlayFollowRow}+${SubtitleOverlayFollowRow}`;

export type SubtitleOverlayLayout = SubtitleOverlayRowsLayout | `${SubtitleOverlayRowsLayout}|only`;

export interface SubtitleOverlayRow {
  role: SubtitleOverlayRowSource;
  text: string;
}

export interface SubtitleOverlaySettings {
  layout: SubtitleOverlayLayout;
  blurUpcoming: boolean;
}
