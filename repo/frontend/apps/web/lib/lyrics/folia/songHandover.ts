import type { Line } from "../../../components/lyrics/folia/src/types";
import type {
  SongCommitInput,
  SongCommitDecision,
  InstrumentalWatchState,
  InstrumentalWatchLimits,
} from "../../../types/lyrics/folia/visualizerSongCommit";

/** 2 seconds of confirmed playback with still no lyrics reads as lyric-less, not still-loading. */
export const DEFAULT_INSTRUMENTAL_COMMIT_SECONDS = 2;
/** Wall-clock cap (ms) so the gate can never hang when playback time never advances. */
export const DEFAULT_READY_GRACE_MS = 8000;

/**
 * Content signature of a lyric set. Identity comparison is useless here: the parent hands down
 * a FRESH `[]` on every render for a loading or lyric-less song, so a `lines` dependency would
 * reset the gate's timer every render and it would never fire.
 *
 * An empty string means "no words", which is deliberately ambiguous between "still loading"
 * and "instrumental" - only playback can tell those apart.
 */
export const getLyricsSignature = (lines: Line[]): string =>
  lines.length === 0 ? "" : JSON.stringify(lines);

/**
 * The whole gate, as a pure decision. Kept separate from the hook so it can be tested without
 * a DOM: the effect below only wires this to rAF and React state.
 */
export const decideSongCommit = ({
  seed,
  committedSeed,
  lyricsSignature,
  committedSignature,
  isCommittedInstrumental,
}: SongCommitInput): SongCommitDecision => {
  if (seed === committedSeed) {
    if (lyricsSignature === "") {
      // Words going away is never news about this song: it is the parent standing between
      // two tracks, and `seed` reaches the visualizer a render before the new lyrics do.
      // Committing the empty set here is what used to flash the "waiting for music"
      // placeholder over a song whose lyrics were already cached.
      if (isCommittedInstrumental || committedSignature !== "") {
        return { action: "idle" };
      }
      return { action: "watch" };
    }
    // Same song, different words: a late load or a reprocess. Take it in place - holding
    // here would leave the mode rendering lyrics the player has already moved past.
    if (lyricsSignature !== committedSignature) {
      return { action: "commit", isInstrumental: false };
    }
    return { action: "idle" };
  }

  // A new song takes the stage once its words land, and they have to be *different* words:
  // `seed` flips a render before `lines` does, so an identical signature is the outgoing
  // song's lyrics still sitting in the prop, not the incoming song's.
  if (lyricsSignature !== "" && lyricsSignature !== committedSignature) {
    return { action: "commit", isInstrumental: false };
  }
  return { action: "watch" };
};

/**
 * Tied to PLAYBACK, not wall clock: a song that is merely loading has not advanced yet and
 * keeps waiting for its words, while one that has genuinely played this far without any is
 * treated as instrumental. `readyGraceMs` is the escape hatch for a song that never starts.
 */
export const isInstrumentalConfirmed = (
  { sawPlaybackReset, playbackTime, elapsedMs }: InstrumentalWatchState,
  { instrumentalCommitSeconds, readyGraceMs }: InstrumentalWatchLimits,
): boolean =>
  (sawPlaybackReset && playbackTime >= instrumentalCommitSeconds) || elapsedMs >= readyGraceMs;
