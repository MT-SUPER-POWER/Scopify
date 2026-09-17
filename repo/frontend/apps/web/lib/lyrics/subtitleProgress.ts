import type { LyricDisplayLine } from "@/types/lyrics";

const graphemes = (text: string) =>
  Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function subtitleLineProgress(line: LyricDisplayLine, time: number): number[] {
  const characters = graphemes(line.text);
  if (line.words.length && line.words.map((word) => word.text).join("") === line.text) {
    return line.words.flatMap((word) => {
      const letters = graphemes(word.text);
      const progress =
        time < word.startTimeMs
          ? 0
          : time >= word.endTimeMs
            ? 1
            : clamp((time - word.startTimeMs) / Math.max(1, word.endTimeMs - word.startTimeMs));
      return letters.map((_, index) => clamp(progress * letters.length - index));
    });
  }
  const progress = clamp(
    (time - line.startTimeMs) / Math.max(1, line.endTimeMs - line.startTimeMs),
  );
  return characters.map((_, index) => clamp(progress * characters.length - index));
}
