import {
  DEFAULT_INSTRUMENTAL_COMMIT_SECONDS,
  DEFAULT_READY_GRACE_MS,
  getLyricsSignature,
  decideSongCommit,
  isInstrumentalConfirmed,
} from "../../lib/lyrics/folia/songHandover";
import type {
  VisualizerSongCommit,
  UseVisualizerSongCommitOptions,
} from "../../types/lyrics/folia/visualizerSongCommit";
export type {
  VisualizerSongCommit,
  SongCommitInput,
  SongCommitDecision,
  InstrumentalWatchState,
  InstrumentalWatchLimits,
  UseVisualizerSongCommitOptions,
} from "../../types/lyrics/folia/visualizerSongCommit";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Line } from "../../components/lyrics/folia/src/types";

// src/components/visualizer/songHandover.ts
// Shared "which song is actually on screen" gate for visualizers that rebuild something
// expensive per track. The parent clears lyrics to [] on a switch and fills them in a few
// renders later, so a mode that follows `seed` directly rebuilds against an empty song and
// pops its words in afterwards. Everything below runs on a COMMITTED song that lags the real
// one until the new one is ready.

/** Stable identity, so committing "no words" never looks like a content change. */
const EMPTY_COMMITTED_LINES: Line[] = [];

/**
 * Holds the outgoing song on screen until the incoming one is ready, then commits it in one
 * step. Modes should build everything song-scoped from the returned values rather than from
 * the raw `seed` / `lines` props.
 */
export const useVisualizerSongCommit = ({
  seed,
  lines,
  currentTime,
  instrumentalCommitSeconds = DEFAULT_INSTRUMENTAL_COMMIT_SECONDS,
  readyGraceMs = DEFAULT_READY_GRACE_MS,
}: UseVisualizerSongCommitOptions): VisualizerSongCommit => {
  const [committed, setCommitted] = useState<VisualizerSongCommit>(() => ({
    seed,
    lines,
    isInstrumental: false,
  }));
  // Behind a ref so the effect can read the newest lines WITHOUT depending on the array
  // identity - see getLyricsSignature on why that dependency would break the gate.
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const lyricsSignature = useMemo(() => getLyricsSignature(lines), [lines]);
  const committedSignature = useMemo(() => getLyricsSignature(committed.lines), [committed.lines]);
  const committedSeed = committed.seed;
  const isCommittedInstrumental = committed.isInstrumental;

  useEffect(() => {
    const decision = decideSongCommit({
      seed,
      committedSeed,
      lyricsSignature,
      committedSignature,
      isCommittedInstrumental,
    });

    if (decision.action === "idle") {
      return undefined;
    }
    if (decision.action === "commit") {
      setCommitted({ seed, lines: linesRef.current, isInstrumental: decision.isInstrumental });
      return undefined;
    }

    let raf = 0;
    let sawPlaybackReset = false;
    const startWall = performance.now();
    const watch = () => {
      const playbackTime = currentTime.get();
      if (!sawPlaybackReset && playbackTime < 1) sawPlaybackReset = true;
      const settled = isInstrumentalConfirmed(
        { sawPlaybackReset, playbackTime, elapsedMs: performance.now() - startWall },
        { instrumentalCommitSeconds, readyGraceMs },
      );
      if (settled) {
        // Committed with no words by definition: whatever is in the prop at this instant
        // can only be the outgoing song's, since a set of words for THIS one would have
        // committed through the decision above long before the watch settled.
        setCommitted({ seed, lines: EMPTY_COMMITTED_LINES, isInstrumental: true });
        return;
      }
      raf = requestAnimationFrame(watch);
    };
    raf = requestAnimationFrame(watch);
    return () => cancelAnimationFrame(raf);
  }, [
    committedSeed,
    committedSignature,
    currentTime,
    instrumentalCommitSeconds,
    isCommittedInstrumental,
    lyricsSignature,
    readyGraceMs,
    seed,
  ]);

  return committed;
};
