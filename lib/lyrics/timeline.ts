import type { LyricDisplayLine, LyricWord } from "@/types/lyrics";

export function findActiveLyricLineIndex(lines: LyricDisplayLine[], currentTimeMs: number): number {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (currentTimeMs >= lines[index].startTimeMs) return index;
  }
  return -1;
}

export function getWordProgress(word: LyricWord, currentTimeMs: number): number {
  if (currentTimeMs <= word.startTimeMs) return 0;
  if (currentTimeMs >= word.endTimeMs) return 1;

  const duration = word.endTimeMs - word.startTimeMs;
  return duration > 0 ? (currentTimeMs - word.startTimeMs) / duration : 1;
}
