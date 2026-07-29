import type {
  Line as FoliaLine,
  LyricData as FoliaLyricData,
} from "@/components/lyrics/folia/src/types";
import type { LyricChorusRange, LyricData } from "@/types/lyrics";

import { detectRepeatedChorusTexts } from "./chorusRanges";

const MILLISECONDS_PER_SECOND = 1_000;
const MINIMUM_TIMED_UNIT_SECONDS = 0.04;
const INTERLUDE_FULL_TEXT = "......";
const INTERLUDE_GAP_SECONDS = 3;
const INTERLUDE_EDGE_PADDING_SECONDS = 0.05;
const LEADING_INTERLUDE_EDGE_PADDING_SECONDS = 0.5;
const CREDIT_MAX_DURATION_SECONDS = 3;
const CHORUS_EFFECTS = ["bars", "circles", "beams"] as const;

export function adaptLyricDataToFolia(
  lyrics: LyricData,
  chorusRanges: LyricChorusRange[] = [],
): FoliaLyricData {
  const lyricLines = lyrics.lines.map((line, index, lines) =>
    adaptLine(line, lines[index + 1]?.startTimeMs, lyrics.isWordByWord),
  );
  const repeatedChorusTexts =
    chorusRanges.length === 0 ? detectRepeatedChorusTexts(lyrics.lines) : new Set<string>();
  const decoratedLyricLines = applyChorusEffects(lyricLines, chorusRanges, repeatedChorusTexts);
  const creditLines = adaptTimedCredits(lyrics.metadata.timedCredits, decoratedLyricLines);

  return {
    artist: lyrics.metadata.artist,
    isWordByWord: lyrics.isWordByWord,
    lines: attachInterludes([...creditLines, ...decoratedLyricLines]),
    title: lyrics.metadata.title,
  };
}

function adaptLine(
  line: LyricData["lines"][number],
  nextLineStartTimeMs: number | undefined,
  isWordByWord: boolean,
): FoliaLine {
  const startTime = line.startTimeMs / MILLISECONDS_PER_SECOND;
  const declaredEndTime = line.endTimeMs / MILLISECONDS_PER_SECOND;
  const nextStartTime =
    nextLineStartTimeMs === undefined ? undefined : nextLineStartTimeMs / MILLISECONDS_PER_SECOND;
  const rawEndTime = resolveRawEndTime(
    line.text,
    startTime,
    declaredEndTime,
    nextStartTime,
    isWordByWord,
  );
  const endTime = resolveDisplayEndTime(startTime, rawEndTime, nextStartTime);

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

function adaptTimedCredits(
  timedCredits: LyricData["metadata"]["timedCredits"],
  lyricLines: FoliaLine[],
): FoliaLine[] {
  const entriesByStartTime = new Map<number, string[]>();

  for (const credit of timedCredits) {
    const text = credit.entries
      .map((entry) => entry.text)
      .join("")
      .trim();
    if (!text) continue;

    const entries = entriesByStartTime.get(credit.startTimeMs) ?? [];
    entries.push(text);
    entriesByStartTime.set(credit.startTimeMs, entries);
  }

  const groups = [...entriesByStartTime.entries()].sort(([left], [right]) => left - right);
  return groups.map(([startTimeMs, texts], index) => {
    const startTime = startTimeMs / MILLISECONDS_PER_SECOND;
    const fullText = texts.join(" · ");
    const nextCreditStartTimeMs = groups[index + 1]?.[0];
    const nextCreditStartTime =
      nextCreditStartTimeMs === undefined
        ? undefined
        : nextCreditStartTimeMs / MILLISECONDS_PER_SECOND;
    const nextLyricStartTime = lyricLines.find((line) => line.startTime > startTime)?.startTime;
    const nextEventStartTime = [nextCreditStartTime, nextLyricStartTime]
      .filter((value): value is number => value !== undefined)
      .reduce<number | undefined>(
        (nearest, value) => (nearest === undefined ? value : Math.min(nearest, value)),
        undefined,
      );
    const endTime = Math.max(
      startTime + MINIMUM_TIMED_UNIT_SECONDS,
      Math.min(
        startTime + CREDIT_MAX_DURATION_SECONDS,
        nextEventStartTime ?? Number.POSITIVE_INFINITY,
      ),
    );

    return {
      endTime,
      fullText,
      startTime,
      words: buildEvenlyTimedWords(texts, startTime, endTime, " · "),
    };
  });
}

function applyChorusEffects(
  lines: FoliaLine[],
  chorusRanges: LyricChorusRange[],
  repeatedChorusTexts: Set<string>,
): FoliaLine[] {
  if (chorusRanges.length === 0 && repeatedChorusTexts.size === 0) return lines;

  const repeatedTextEffects = new Map(
    [...repeatedChorusTexts].map(
      (text, index) => [text, CHORUS_EFFECTS[index % CHORUS_EFFECTS.length]] as const,
    ),
  );

  return lines.map((line) => {
    const matchedRangeIndex = chorusRanges.findIndex(
      (range) =>
        line.startTime < range.endTimeMs / MILLISECONDS_PER_SECOND &&
        line.endTime > range.startTimeMs / MILLISECONDS_PER_SECOND,
    );
    const repeatedTextEffect = repeatedTextEffects.get(line.fullText.trim());
    if (matchedRangeIndex < 0 && !repeatedTextEffect) return line;

    return {
      ...line,
      chorusEffect:
        matchedRangeIndex >= 0
          ? CHORUS_EFFECTS[matchedRangeIndex % CHORUS_EFFECTS.length]
          : repeatedTextEffect,
      isChorus: true,
    };
  });
}

function attachInterludes(lines: FoliaLine[]): FoliaLine[] {
  const sortedLines = [...lines].sort((left, right) => left.startTime - right.startTime);
  if (sortedLines.length === 0) return [];

  const result: FoliaLine[] = [];
  const firstLine = sortedLines[0];
  if (firstLine.startTime > INTERLUDE_GAP_SECONDS) {
    result.push(
      createInterlude(
        LEADING_INTERLUDE_EDGE_PADDING_SECONDS,
        firstLine.startTime - LEADING_INTERLUDE_EDGE_PADDING_SECONDS,
      ),
    );
  }

  sortedLines.forEach((line, index) => {
    result.push(line);
    const nextLine = sortedLines[index + 1];
    if (!nextLine || nextLine.startTime - line.endTime <= INTERLUDE_GAP_SECONDS) return;

    result.push(
      createInterlude(
        line.endTime + INTERLUDE_EDGE_PADDING_SECONDS,
        nextLine.startTime - INTERLUDE_EDGE_PADDING_SECONDS,
      ),
    );
  });

  return result;
}

function createInterlude(startTime: number, endTime: number): FoliaLine {
  return {
    endTime,
    fullText: INTERLUDE_FULL_TEXT,
    startTime,
    words: buildEvenlyTimedWords(
      Array.from({ length: 6 }, () => "."),
      startTime,
      endTime,
    ),
  };
}

function buildEvenlyTimedWords(
  texts: string[],
  startTime: number,
  endTime: number,
  separator = "",
): FoliaLine["words"] {
  const displayTexts = texts.flatMap((text, index) =>
    index > 0 && separator ? [separator, text] : [text],
  );
  const wordDuration = (endTime - startTime) / Math.max(displayTexts.length, 1);
  return displayTexts.map((text, index) => ({
    endTime: startTime + (index + 1) * wordDuration,
    startTime: startTime + index * wordDuration,
    text,
  }));
}

function resolveRawEndTime(
  text: string,
  startTime: number,
  declaredEndTime: number,
  nextStartTime: number | undefined,
  isWordByWord: boolean,
): number {
  if (isWordByWord && declaredEndTime > startTime + MINIMUM_TIMED_UNIT_SECONDS) {
    return declaredEndTime;
  }
  if (nextStartTime === undefined) {
    return declaredEndTime > startTime + MINIMUM_TIMED_UNIT_SECONDS
      ? declaredEndTime
      : startTime + 5;
  }

  const gap = nextStartTime - startTime;
  const readingDuration = text.length * 0.5 + 2;
  return gap > readingDuration && gap > 5 ? startTime + readingDuration : nextStartTime;
}

function resolveDisplayEndTime(
  startTime: number,
  rawEndTime: number,
  nextStartTime: number | undefined,
): number {
  if (nextStartTime === undefined) {
    return Math.max(rawEndTime, startTime + MINIMUM_TIMED_UNIT_SECONDS);
  }
  if (rawEndTime >= nextStartTime || nextStartTime - rawEndTime <= INTERLUDE_GAP_SECONDS) {
    return Math.max(nextStartTime, startTime + MINIMUM_TIMED_UNIT_SECONDS);
  }
  return Math.max(rawEndTime, startTime + MINIMUM_TIMED_UNIT_SECONDS);
}
