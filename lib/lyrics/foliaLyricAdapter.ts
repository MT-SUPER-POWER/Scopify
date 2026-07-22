import type {
  Line as FoliaLine,
  LyricData as FoliaLyricData,
} from "@/components/lyrics/folia/src/types";
import type { LyricData } from "@/types/lyrics";

const MILLISECONDS_PER_SECOND = 1_000;
const MINIMUM_TIMED_UNIT_SECONDS = 0.04;

export function adaptLyricDataToFolia(lyrics: LyricData): FoliaLyricData {
  return {
    artist: lyrics.metadata.artist,
    isWordByWord: lyrics.isWordByWord,
    lines: lyrics.lines.map((line, index, lines) => adaptLine(line, lines[index + 1]?.startTimeMs)),
    title: lyrics.metadata.title,
  };
}

function adaptLine(line: LyricData["lines"][number], nextLineStartTimeMs?: number): FoliaLine {
  const startTime = line.startTimeMs / MILLISECONDS_PER_SECOND;
  const declaredEndTime = line.endTimeMs / MILLISECONDS_PER_SECOND;
  const fallbackEndTime = nextLineStartTimeMs
    ? nextLineStartTimeMs / MILLISECONDS_PER_SECOND
    : startTime + 5;
  const endTime =
    declaredEndTime > startTime + MINIMUM_TIMED_UNIT_SECONDS
      ? declaredEndTime
      : Math.max(fallbackEndTime, startTime + MINIMUM_TIMED_UNIT_SECONDS);

  return {
    alternateTexts: [
      ...(line.translation ? [{ role: "translation" as const, text: line.translation }] : []),
      ...(line.romanization ? [{ role: "romanization" as const, text: line.romanization }] : []),
    ],
    endTime,
    fullText: line.text,
    romanization: line.romanization,
    startTime,
    translation: line.translation,
    words: line.words.map((word) => {
      const wordStartTime = word.startTimeMs / MILLISECONDS_PER_SECOND;
      return {
        endTime: Math.max(
          word.endTimeMs / MILLISECONDS_PER_SECOND,
          wordStartTime + MINIMUM_TIMED_UNIT_SECONDS,
        ),
        startTime: wordStartTime,
        text: word.text,
      };
    }),
  };
}
