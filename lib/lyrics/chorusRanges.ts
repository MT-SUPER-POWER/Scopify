import type { SongChorusResponse } from "@/types/api/music";
import type { LyricChorusRange } from "@/types/lyrics";

export function normalizeSongChorusRanges(response: SongChorusResponse): LyricChorusRange[] {
  if (response.code !== 200) return [];

  const ranges = response.chorus ?? response.data ?? [];
  return ranges.flatMap((range) => {
    if (
      !Number.isFinite(range.startTime) ||
      !Number.isFinite(range.endTime) ||
      range.endTime <= range.startTime
    ) {
      return [];
    }
    return [{ endTimeMs: range.endTime, startTimeMs: range.startTime }];
  });
}
