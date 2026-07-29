import type { SongChorusResponse } from "@/types/api/music";
import type { LyricChorusRange, LyricDisplayLine } from "@/types/lyrics";

const INTERLUDE_FULL_TEXT = "......";

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

/** Folia fallback: the most frequently repeated lyric text is treated as chorus. */
export function detectRepeatedChorusTexts(
  lines: readonly Pick<LyricDisplayLine, "text">[],
): Set<string> {
  const counts = new Map<string, number>();

  for (const line of lines) {
    const text = line.text.trim();
    if (!text || text === INTERLUDE_FULL_TEXT || Array.from(text).length < 2) continue;
    counts.set(text, (counts.get(text) ?? 0) + 1);
  }

  const maxCount = Math.max(0, ...counts.values());
  if (maxCount <= 1) return new Set();

  return new Set(
    [...counts.entries()].flatMap(([text, count]) => (count === maxCount ? [text] : [])),
  );
}
