import type { LyricData as FoliaLyricData } from "@/components/lyrics/folia/src/types";
import type { LyricChorusRange } from "@/types/lyrics/model";

const CHORUS_PART_RE = /chorus|副歌/i;
const EDGE_MARGIN = 0.01;
const MILLISECONDS_PER_SECOND = 1_000;

export function getChorusProgressRanges(
  ranges: readonly LyricChorusRange[],
  totalTimeMs: number,
): Array<{ endPercent: number; startPercent: number }> {
  if (!Number.isFinite(totalTimeMs) || totalTimeMs <= 0) return [];

  const uniqueRanges = new Map<string, { endTimeMs: number; startTimeMs: number }>();
  for (const range of ranges) {
    if (!Number.isFinite(range.startTimeMs) || !Number.isFinite(range.endTimeMs)) continue;

    const startTimeMs = Math.max(0, range.startTimeMs);
    const endTimeMs = Math.min(totalTimeMs, range.endTimeMs);
    if (startTimeMs >= totalTimeMs || endTimeMs <= startTimeMs) continue;

    uniqueRanges.set(`${startTimeMs}:${endTimeMs}`, { endTimeMs, startTimeMs });
  }

  return [...uniqueRanges.values()]
    .sort((left, right) => left.startTimeMs - right.startTimeMs)
    .map(({ endTimeMs, startTimeMs }) => ({
      endPercent: (endTimeMs / totalTimeMs) * 100,
      startPercent: (startTimeMs / totalTimeMs) * 100,
    }));
}

/**
 * Resolve the first source-provided chorus start time in seconds.
 * When lyric lines are present, only source-attributed choruses (platform ranges or TTML
 * `songPart`) are accepted; host repeated-text guesses return null. Without lyric lines,
 * falls back to the earliest valid platform chorus range.
 */
export function findSourceChorusStartSec(
  lyrics?: FoliaLyricData | null,
  chorusRanges?: readonly LyricChorusRange[],
): number | null {
  if (lyrics && lyrics.lines.length > 0) {
    const line = lyrics.lines.find(
      (candidate) =>
        (candidate.isChorus && candidate.chorusOrigin === "source") ||
        CHORUS_PART_RE.test(candidate.songPart ?? ""),
    );
    if (!line || !Number.isFinite(line.startTime)) return null;
    const range = lyrics.sourceChorusRanges?.find(
      (candidate) => line.startTime < candidate.endTime && line.endTime > candidate.startTime,
    );
    return range && Number.isFinite(range.startTime)
      ? Math.max(line.startTime, range.startTime)
      : line.startTime;
  }

  if (!chorusRanges || chorusRanges.length === 0) return null;
  let earliestSec: number | null = null;
  for (const range of chorusRanges) {
    if (
      !Number.isFinite(range.startTimeMs) ||
      !Number.isFinite(range.endTimeMs) ||
      range.endTimeMs <= range.startTimeMs
    ) {
      continue;
    }
    const startSec = Math.max(0, range.startTimeMs) / MILLISECONDS_PER_SECOND;
    if (earliestSec === null || startSec < earliestSec) earliestSec = startSec;
  }
  return earliestSec;
}

/** Convert a chorus start time (seconds) + lyric offset (ms) to a `[0, 1]` track fraction. */
export function getChorusMarkerFraction(
  chorusStartSec: number | null,
  offsetMs: number,
  durationSec: number,
): number | null {
  if (chorusStartSec === null || !(durationSec > 0)) return null;
  const fraction = (chorusStartSec + offsetMs / MILLISECONDS_PER_SECOND) / durationSec;
  if (!Number.isFinite(fraction) || fraction <= EDGE_MARGIN || fraction >= 1 - EDGE_MARGIN) {
    return null;
  }
  return fraction;
}
