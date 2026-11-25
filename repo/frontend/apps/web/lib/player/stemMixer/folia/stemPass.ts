import type { StemChannels } from "@/types/audio/stemMixer";

import { HTDEMUCS_SEGMENT as HTDEMUCS_GPU_SEGMENT } from "./htdemucsWgsl/runtime";
import { STEM_SOURCES, stemSegmentStarts, stemSegmentWindow } from "./stemRange";

// src/services/analysis/stemPass.ts
// One pass over a track's htdemucs segments for whatever reads its stems: the drum hits (drumHits.ts)
// and 雾笺's voice (vocalStemRun.ts) today. The model gives all four stems for every segment, so a segment
// is separated once for every reader that needs it, whichever stems they read.
//
// A reader (StemReader) names its stem (mono, or one channel of it), the next segment it needs and a window to lay that stem
// together in. Each turn the pass separates the lowest segment any reader still needs and hands it to
// every reader at that segment; a reader that starts further back (asked for part way through, from
// the playhead) is fed its own segments first, alone, until it catches up and they share. Readers can
// be added or let go between any two segments (`readers` is asked every turn).
//
// The laying together is drumStem.ts' (the reference implementation's): segments step by three
// quarters of their length, each faded across the quarter it shares with a neighbour by a triangular
// window, the sum divided by the total weight; once a segment is in, everything before the next
// segment's start is final - divided then, and handed to the reader. The weight is not summed into an
// array but worked out at each sample (`weightAt`): the windows of the at most two segments over it, in
// the order a running sum adds them, rounded as a Float32Array rounds them - so a stem is the same, bit
// for bit, as one summed with a weight array, and a reader that starts or carries on part way needs no
// weight behind it. A reader starting part way has its stem whole from where the segment before its
// first one ends (`stemWholeFrom`); before that it lacks that segment's share, and is left at zero.
//
// A reader can be held (not fed for now: 分轨调音台 once far enough ahead of the playhead), urgent
// (its segments first, ahead of a reader further back: what is about to be heard) and pace the others
// (they go no further than it, so the segments both want are separated once).
//
// The window is the reader's: the whole track (base 0, nothing let go), or a stretch of it that moves on
// once the reader has read what is final (`read` answers the first sample it will read again) - a
// segment and what the reader reads again behind it, rather than the whole track's samples.

export type StemSource = (typeof STEM_SOURCES)[number];

/** How often a pass whose readers are all held asks again. */
const HELD_POLL_MS = 200;

/** A stem from sample `base` on: `samples[i]` is sample `base + i`. */
export interface StemWindow {
  samples: Float32Array;
  base: number;
}

export interface StemReader {
  readonly source: StemSource;
  /**
   * One channel of the stem, for a reader that plays it (分轨调音台); without it the two are averaged
   * to mono, which is what the analyses read.
   */
  readonly channel?: "left" | "right";
  /**
   * Not to be fed now (分轨调音台, far enough ahead of the playhead): skipped, neither waiting nor
   * through. The pass goes on for the others; with only held readers left it waits (HELD_POLL_MS) and
   * asks again.
   */
  readonly held?: () => boolean;
  /**
   * Whether its segments go first now (分轨调音台: what is about to be heard), before the lowest segment
   * of the others. Asked each turn, so it can be urgent only while short of what it needs soon.
   */
  readonly urgent?: () => boolean;
  /**
   * The others go no further than it (分轨调音台 with 智能动感模式 on): while it is on the pass, a reader
   * without it is fed only up to its next segment, and below that while it is held - so a segment both
   * want is separated once, for both, instead of once ahead for the others and again when it comes.
   */
  readonly paces?: boolean;
  /** The next segment it needs; the pass moves it on. */
  next: number;
  /** Samples from the start whose quotient is final; the pass moves it on. */
  divided: number;
  readonly window: StemWindow;
  /**
   * After each of its segments: the window is final up to `final` (the whole track at `end`). Answers
   * the first sample it will read again, which the window keeps; nothing (or past `final`) keeps
   * from `final` on - from there on it holds the running sum of the segment after.
   */
  read: (final: number, end: boolean) => void | number | Promise<void | number>;
}

/** The first sample of a stem whole for a reader starting at segment `from`: where the segment before it ends. */
export const stemWholeFrom = (
  total: number,
  from: number,
  segment = HTDEMUCS_GPU_SEGMENT,
): number => {
  if (from <= 0) return 0;
  const starts = stemSegmentStarts(total, segment);
  return Math.min(total, starts[Math.min(from, starts.length) - 1] + segment);
};

/** A window over the whole track: nothing let go. */
export const wholeStemWindow = (total: number): StemWindow => ({
  samples: new Float32Array(total),
  base: 0,
});

/** A window for a reader from segment `from` on that reads `keepBefore` samples behind what is final again. */
export const movingStemWindow = (
  total: number,
  from: number,
  keepBefore: number,
  segment = HTDEMUCS_GPU_SEGMENT,
): StemWindow => {
  const starts = stemSegmentStarts(total, segment);
  return {
    samples: new Float32Array(segment + keepBefore),
    base: starts[Math.min(from, starts.length - 1)],
  };
};

/** A fresh reader's state from segment `from` on: its stem is divided from where it is whole. */
export const startStemReader = (total: number, from = 0, segment = HTDEMUCS_GPU_SEGMENT) => ({
  next: from,
  divided: stemWholeFrom(total, from, segment),
});

/**
 * The overlap-add weight at sample `at` of segment `index`, for `at` before the next segment starts:
 * the window of the segment before (while it still reaches), then this one's (see the header).
 */
const weightAt = (
  at: number,
  index: number,
  starts: number[],
  win: Float32Array,
  segment: number,
): number => {
  const before = index > 0 && at < starts[index - 1] + segment ? win[at - starts[index - 1]] : 0;
  return Math.fround(before + win[at - starts[index]]);
};

/** Moves a window on to start at `keep`: what is before it is let go. */
const moveWindow = (window: StemWindow, keep: number) => {
  const by = keep - window.base;
  if (by <= 0) return;
  window.samples.copyWithin(0, by);
  window.samples.fill(0, window.samples.length - by);
  window.base = keep;
};

/** Lays segment `index`'s stem into a reader's window and divides what is now final; answers `final`. */
const layInto = (
  reader: StemReader,
  stem: { left: Float32Array; right: Float32Array },
  index: number,
  n: number,
  starts: number[],
  win: Float32Array,
  segment: number,
  total: number,
) => {
  const start = starts[index];
  const { samples, base } = reader.window;
  // A typed array drops a write past its end without a word: a window too short is a bug.
  if (start < base || start + n - base > samples.length)
    throw new Error(`stem window: segment ${index} at ${start} outside ${base}+${samples.length}`);
  if (reader.channel) {
    const from = reader.channel === "left" ? stem.left : stem.right;
    for (let i = 0; i < n; i += 1) samples[start - base + i] += from[i] * win[i];
  } else {
    for (let i = 0; i < n; i += 1)
      samples[start - base + i] += ((stem.left[i] + stem.right[i]) / 2) * win[i];
  }
  // A reader starting part way: before where it is whole the segment before's share never came.
  if (reader.divided > start) samples.fill(0, 0, Math.min(samples.length, reader.divided - base));
  // Up to where the next segment starts, nothing more will be added.
  const final = index + 1 < starts.length ? starts[index + 1] : total;
  for (let i = Math.max(reader.divided, start); i < final; i += 1)
    samples[i - base] /= Math.max(weightAt(i, index, starts, win, segment), 1e-8);
  reader.divided = Math.max(reader.divided, final);
  reader.next = index + 1;
  return final;
};

/**
 * Runs the segments `readers()` need over a stereo 44.1 kHz track (see the header): true once none is
 * left, false as soon as `keepGoing` says no (asked before each) or a segment cannot be separated.
 * Scopify supplies its own serial GPU worker for each segment.
 */
export const runStemPass = async ({
  left,
  right,
  readers,
  keepGoing = () => true,
  separate,
}: {
  left: Float32Array;
  right: Float32Array;
  readers: () => readonly StemReader[];
  keepGoing?: () => boolean;
  separate: (left: Float32Array, right: Float32Array) => Promise<StemChannels[]>;
}): Promise<boolean> => {
  const segment = HTDEMUCS_GPU_SEGMENT;
  const total = left.length;
  const win = stemSegmentWindow(segment);
  const starts = stemSegmentStarts(total, segment);
  const inLeft = new Float32Array(segment);
  const inRight = new Float32Array(segment);
  for (;;) {
    const unfinished = readers().filter((reader) => reader.next < starts.length);
    if (!unfinished.length) return true;
    if (!keepGoing()) return false;
    const held = new Set(unfinished.filter((reader) => reader.held?.()));
    const leads = unfinished.filter((reader) => reader.paces);
    const limit = leads.length
      ? Math.min(...leads.map((reader) => (held.has(reader) ? reader.next - 1 : reader.next)))
      : Infinity;
    const waiting = unfinished.filter(
      (reader) => !held.has(reader) && (reader.paces || reader.next <= limit),
    );
    if (!waiting.length) {
      await new Promise((resolve) => setTimeout(resolve, HELD_POLL_MS));
      continue;
    }
    const urgent = waiting.filter((reader) => reader.urgent?.());
    const first = urgent.length ? urgent : waiting;
    const index = Math.min(...first.map((reader) => reader.next));
    const start = starts[index];
    const n = Math.min(segment, total - start);
    // The last segment runs past the end of the track: zeros, as the reference pads it.
    inLeft.fill(0);
    inRight.fill(0);
    inLeft.set(left.subarray(start, start + n));
    inRight.set(right.subarray(start, start + n));
    const group = waiting.filter((reader) => reader.next === index);
    const stems = await separate(inLeft, inRight);
    if (!keepGoing()) return false;
    for (const reader of group) {
      const stem = stems[STEM_SOURCES.indexOf(reader.source)];
      if (!stem) return false;
      const final = layInto(reader, stem, index, n, starts, win, segment, total);
      const needed = await reader.read(final, final >= total);
      moveWindow(reader.window, Math.min(final, typeof needed === "number" ? needed : final));
    }
  }
};
