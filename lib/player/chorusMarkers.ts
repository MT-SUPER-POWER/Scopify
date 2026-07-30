import type { LyricChorusRange } from "@/types/lyrics";

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
