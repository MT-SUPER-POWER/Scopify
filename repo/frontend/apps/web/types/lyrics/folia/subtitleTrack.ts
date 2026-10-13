/** Which alternate text a subtitle row carries (Folia 871a7ba6). */
export type SubtitleTrackRole = "romanization" | "translation";

/** One subtitle row: single-source modes carry exactly one, the dual mode up to two. */
export interface SubtitleTrack {
  role: SubtitleTrackRole;
  text: string;
}
