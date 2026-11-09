import type { MusicResourceRef } from "./identity";

/**
 * The text of one lyric in a timing style a platform can serve. Line-timed text is LRC
 * (`[mm:ss.xx]words`); word-timed text is YRC (`[start,duration](start,duration,0)word`). The
 * renderer parses both, so a platform only fills the styles it has.
 */
export interface MusicLyricsText {
  /** The sung words. Null when the platform serves none in this style. */
  original: string | null;
  /** A translation, timed like the original. */
  translation: string | null;
  /** A romanization (pinyin, romaji), timed like the original. */
  romanization: string | null;
}

/** The lyrics of one track, as text the renderer turns into display lines. */
export interface MusicLyrics {
  ref: MusicResourceRef<"track">;
  /** The platform marks the track as instrumental, so there is nothing to show. */
  pureMusic: boolean;
  /** Line-timed text, which every platform with lyrics serves. */
  lines: MusicLyricsText;
  /** Word-timed text, for platforms and tracks that have it; null otherwise. */
  words: MusicLyricsText | null;
}

export interface MusicLyricsSource {
  /**
   * The lyrics of a track. A track without lyrics yields a value with empty texts rather than
   * an error, so the player can tell "none" from "failed". Needs the `track.lyrics` capability.
   */
  getLyrics(ref: MusicResourceRef<"track">, signal?: AbortSignal): Promise<MusicLyrics>;
}
