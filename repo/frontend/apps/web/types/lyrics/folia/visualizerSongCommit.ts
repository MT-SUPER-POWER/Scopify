import type { MotionValue } from "framer-motion";
import type { Line } from "../../../components/lyrics/folia/src/types";

export interface VisualizerSongCommit {
  seed: string | number | undefined;
  lines: Line[];
  /** Committed with no words after playback confirmed it: the ♪ / procedural path. */
  isInstrumental: boolean;
}

export interface SongCommitInput {
  seed: string | number | undefined;
  committedSeed: string | number | undefined;
  lyricsSignature: string;
  committedSignature: string;
  isCommittedInstrumental: boolean;
}

export type SongCommitDecision =
  /** Take the incoming song now. */
  | { action: "commit"; isInstrumental: boolean }
  /** Keep the committed song up and watch playback to see which kind of silence this is. */
  | { action: "watch" }
  /** Nothing to decide. */
  | { action: "idle" };

export interface InstrumentalWatchState {
  /** The new song's playback was seen near its start, so the clock really did reset. */
  sawPlaybackReset: boolean;
  playbackTime: number;
  elapsedMs: number;
}

export interface InstrumentalWatchLimits {
  instrumentalCommitSeconds: number;
  readyGraceMs: number;
}

export interface UseVisualizerSongCommitOptions {
  seed: string | number | undefined;
  lines: Line[];
  currentTime: MotionValue<number>;
  instrumentalCommitSeconds?: number;
  readyGraceMs?: number;
}
