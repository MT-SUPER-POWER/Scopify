import type { NeteaseLyric } from "@/types/api/music";

/** A NetEase song selected as the source for another track's lyrics. */
export interface LyricMatchCandidate {
  albumName: string;
  artistNames: string[];
  coverUrl: string | null;
  durationMs: number;
  id: number;
  name: string;
}

/** Persisted manual lyric selection for a song. */
export interface LyricMatchOverride {
  candidate: LyricMatchCandidate;
  lyric: NeteaseLyric;
  matchedAt: number;
}

/** A locally imported lyric file kept alongside, rather than replacing, the online source. */
export interface ImportedLyricOverride {
  fileName: string;
  importedAt: number;
  lyric: NeteaseLyric;
}

/** The active source selected in the Folia-compatible lyrics tab. */
export type LyricSourceSelection = "imported" | "online";

/** Normalized FFT-derived values, using Folia's 0-255 scale. */
export interface LyricAudioBands {
  bass: number;
  lowMid: number;
  mid: number;
  power: number;
  spectrum: number[];
  treble: number;
  vocal: number;
}

/** One item in a timed lyric credit. */
export interface LyricCreditEntry {
  imageUrl?: string;
  target?: string;
  text: string;
}

/**
 * The presentation contract for every lyric renderer.
 *
 * `raw` is the exact API response used to derive this data. It is retained so
 * consumers can access future NetEase fields without needing another request.
 */
export interface LyricData {
  isPureMusic: boolean;
  isWordByWord: boolean;
  lines: LyricDisplayLine[];
  metadata: LyricMetadata;
  raw: NeteaseLyric;
  source: LyricTimingSource;
}

/** A display-ready line shared by the lyric stage and desktop lyric window. */
export interface LyricDisplayLine {
  endTimeMs: number;
  romanization?: string;
  startTimeMs: number;
  text: string;
  translation?: string;
  words: LyricWord[];
}

/** Metadata extracted from standard LRC tags and NetEase timed credit records. */
export interface LyricMetadata {
  album?: string;
  artist?: string;
  by?: string;
  offsetMs?: number;
  timedCredits: LyricTimedCredit[];
  title?: string;
}

export interface LyricStageLyricsProps {
  activeLineIndex: number;
  currentTimeMs: number;
  fontScale: number;
  lines: LyricDisplayLine[];
  showRomanization: boolean;
  showTranslation: boolean;
}

/** Persisted preferences for the full-screen Lyric Stage. */
export interface LyricStageSettings {
  fontScale: number;
  mode: LyricVisualizerMode;
  showRomanization: boolean;
  showTranslation: boolean;
}

/** A timed credit embedded as JSON at the beginning of some NetEase YRC files. */
export interface LyricTimedCredit {
  entries: LyricCreditEntry[];
  startTimeMs: number;
}

/** The timing format selected as the primary display source. */
export type LyricTimingSource = "lrc" | "none" | "yrc";

/** A Stage frame that can be rendered by any registered visualizer. */
export interface LyricVisualizerFrame {
  activeLineIndex: number;
  audioBands: LyricAudioBands;
  currentTimeMs: number;
  isPlaying: boolean;
  lyrics: LyricData | null;
}

/** The explicitly registered Folia-derived presentation modes. */
export type LyricVisualizerMode =
  | "cadenza"
  | "cappella"
  | "claddagh"
  | "classic"
  | "diorama"
  | "fume"
  | "monet"
  | "partita"
  | "tilt";

export interface LyricVisualizerRendererProps {
  frame: LyricVisualizerFrame;
  mode: LyricVisualizerMode;
}

/** One timed word or syllable in a display line, measured in milliseconds. */
export interface LyricWord {
  endTimeMs: number;
  startTimeMs: number;
  text: string;
}
