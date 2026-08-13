import type { NeteaseLyric } from "@/types/api/music";
import type {
  LyricCreditEntry,
  LyricData,
  LyricDisplayLine,
  LyricMetadata,
  LyricTimedCredit,
  LyricWord,
} from "@/types/lyrics";

import { buildSyntheticTimedWords } from "./syntheticWordTiming";

const LRC_TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const LRC_METADATA_TAG = /^\[([a-zA-Z]+):\s*(.*?)\]\s*$/;
const YRC_LINE = /^\[(\d+),(\d+)\](.*)$/;
const YRC_WORD = /\((\d+),(\d+),\d+\)(.*?)(?=\(\d+,\d+,\d+\)|$)/g;
const MAX_ALIGNMENT_DRIFT_MS = 750;

interface TimedText {
  startTimeMs: number;
  text: string;
}

/**
 * Converts a lossless NetEase lyric response to the renderer's shared model.
 * YRC is preferred whenever it contains timed word data; LRC remains the
 * fallback for tracks without word-level timing.
 */
export function adaptNeteaseLyric(lyric: NeteaseLyric): LyricData {
  const metadata = createMetadata();
  const yrc = lyricText(lyric.yrc?.lyric);
  const lrc = lyricText(lyric.lrc?.lyric);
  const yrcLines = yrc ? parseYrcText(yrc, metadata) : [];
  const source = yrcLines.length > 0 ? "yrc" : lrc ? "lrc" : "none";
  const primaryLines = source === "yrc" ? yrcLines : lrc ? parseLrcText(lrc, metadata) : [];

  const translationSource =
    source === "yrc"
      ? firstLyricText(lyric.ytlrc?.lyric, lyric.tlyric?.lyric)
      : firstLyricText(lyric.tlyric?.lyric, lyric.ytlrc?.lyric);
  const romanizationSource =
    source === "yrc"
      ? firstLyricText(lyric.yromalrc?.lyric, lyric.romalrc?.lyric)
      : firstLyricText(lyric.romalrc?.lyric, lyric.yromalrc?.lyric);

  return {
    isPureMusic: isPureMusic(lyric),
    isWordByWord: source === "yrc",
    lines: withAlignedText(
      primaryLines,
      translationSource ? parseTimedText(translationSource) : [],
      romanizationSource ? parseTimedText(romanizationSource) : [],
    ),
    metadata,
    raw: lyric,
    source,
  };
}

function alignTimedText(lines: LyricDisplayLine[], entries: TimedText[]): (string | undefined)[] {
  const unusedEntryIndexes = new Set(entries.map((_, index) => index));

  return lines.map((line) => {
    let nearestIndex: number | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const index of unusedEntryIndexes) {
      const distance = Math.abs(entries[index].startTimeMs - line.startTimeMs);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    if (nearestIndex === undefined || nearestDistance > MAX_ALIGNMENT_DRIFT_MS) return undefined;
    unusedEntryIndexes.delete(nearestIndex);
    return entries[nearestIndex].text || undefined;
  });
}

function createMetadata(): LyricMetadata {
  return { timedCredits: [] };
}

function finalizeLineDurations(lines: LyricDisplayLine[]): LyricDisplayLine[] {
  const orderedLines = [...lines].sort((left, right) => left.startTimeMs - right.startTimeMs);
  return orderedLines.map((line, index) => {
    const nextStartTimeMs = orderedLines[index + 1]?.startTimeMs;
    let durationMs = nextStartTimeMs === undefined ? 5_000 : nextStartTimeMs - line.startTimeMs;
    const estimatedReadingTimeMs = line.text.length * 500;
    if (durationMs > estimatedReadingTimeMs + 2_000 && durationMs > 5_000) {
      durationMs = Math.min(durationMs, estimatedReadingTimeMs + 2_000);
    }
    const endTimeMs = line.startTimeMs + durationMs;

    return {
      ...line,
      endTimeMs,
      words: buildSyntheticTimedWords(line.text, line.startTimeMs, endTimeMs),
    };
  });
}

function firstLyricText(...values: (null | string | undefined)[]): string {
  return values.map(lyricText).find((value) => value.length > 0) ?? "";
}

function isPureMusic(lyric: NeteaseLyric): boolean {
  return [
    lyric.pureMusic,
    lyric.lrc?.pureMusic,
    lyric.yrc?.pureMusic,
    lyric.tlyric?.pureMusic,
    lyric.ytlrc?.pureMusic,
  ].some((value) => value === true);
}

function lyricText(value: null | string | undefined): string {
  return value?.trim() ?? "";
}

function parseLrcText(input: string, metadata = createMetadata()): LyricDisplayLine[] {
  const lines: LyricDisplayLine[] = [];
  const offsetMatch = /^\[offset:\s*(-?\d+)\]\s*$/im.exec(input);
  if (offsetMatch) metadata.offsetMs = Number(offsetMatch[1]);

  for (const rawLine of input.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const metadataMatch = LRC_METADATA_TAG.exec(rawLine);
    if (metadataMatch) {
      const [, key, value] = metadataMatch;
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === "ti") metadata.title = value;
      if (normalizedKey === "ar") metadata.artist = value;
      if (normalizedKey === "al") metadata.album = value;
      if (normalizedKey === "by") metadata.by = value;
      continue;
    }

    const timestamps = [...rawLine.matchAll(LRC_TIME_TAG)];
    if (timestamps.length === 0) continue;

    const text = rawLine.replace(LRC_TIME_TAG, "").trim();
    for (const timestamp of timestamps) {
      const startTimeMs =
        parseTimestamp(timestamp[1], timestamp[2], timestamp[3]) + (metadata.offsetMs ?? 0);
      lines.push({
        endTimeMs: startTimeMs,
        startTimeMs,
        text,
        words: [{ endTimeMs: startTimeMs, startTimeMs, text }],
      });
    }
  }

  return finalizeLineDurations(lines);
}

function parseTimedCredit(rawLine: string): LyricTimedCredit | null {
  try {
    const parsed: unknown = JSON.parse(rawLine);
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as {
      c?: unknown;
      t?: unknown;
    };
    if (
      typeof candidate.t !== "number" ||
      !Number.isFinite(candidate.t) ||
      !Array.isArray(candidate.c)
    ) {
      return null;
    }

    const entries = candidate.c.flatMap((entry): LyricCreditEntry[] => {
      if (!entry || typeof entry !== "object") return [];
      const credit = entry as { li?: unknown; or?: unknown; tx?: unknown };
      if (typeof credit.tx !== "string") return [];
      return [
        {
          text: credit.tx,
          ...(typeof credit.li === "string" ? { imageUrl: credit.li } : {}),
          ...(typeof credit.or === "string" ? { target: credit.or } : {}),
        },
      ];
    });

    return { entries, startTimeMs: candidate.t };
  } catch {
    return null;
  }
}

function parseTimedText(input: string): TimedText[] {
  return parseLrcText(input).map((line) => ({
    startTimeMs: line.startTimeMs,
    text: line.text,
  }));
}

function parseTimestamp(minutes: string, seconds: string, fraction?: string): number {
  const fractionMs = fraction ? Number(fraction.padEnd(3, "0")) : 0;
  return Number(minutes) * 60_000 + Number(seconds) * 1_000 + fractionMs;
}

function parseYrcText(input: string, metadata: LyricMetadata): LyricDisplayLine[] {
  const lines: LyricDisplayLine[] = [];

  for (const rawLine of input.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const timedCredit = parseTimedCredit(rawLine);
    if (timedCredit) {
      metadata.timedCredits.push(timedCredit);
      continue;
    }

    const lineMatch = YRC_LINE.exec(rawLine);
    if (!lineMatch) continue;

    const startTimeMs = Number(lineMatch[1]);
    const endTimeMs = startTimeMs + Number(lineMatch[2]);
    const words: LyricWord[] = [];
    let wordMatch: null | RegExpExecArray;
    YRC_WORD.lastIndex = 0;

    while ((wordMatch = YRC_WORD.exec(lineMatch[3])) !== null) {
      const wordStartTimeMs = Number(wordMatch[1]);
      words.push({
        endTimeMs: wordStartTimeMs + Number(wordMatch[2]),
        startTimeMs: wordStartTimeMs,
        text: wordMatch[3],
      });
    }

    const text = words.map((word) => word.text).join("") || lineMatch[3].trim();
    if (!text && words.length === 0) continue;

    lines.push({
      endTimeMs,
      startTimeMs,
      text,
      words: words.length > 0 ? words : [{ endTimeMs, startTimeMs, text }],
    });
  }

  return lines.sort((left, right) => left.startTimeMs - right.startTimeMs);
}

function withAlignedText(
  lines: LyricDisplayLine[],
  translations: TimedText[],
  romanizations: TimedText[],
): LyricDisplayLine[] {
  const alignedTranslations = alignTimedText(lines, translations);
  const alignedRomanizations = alignTimedText(lines, romanizations);

  return lines.map((line, index) => ({
    ...line,
    ...(alignedTranslations[index] ? { translation: alignedTranslations[index] } : {}),
    ...(alignedRomanizations[index] ? { romanization: alignedRomanizations[index] } : {}),
  }));
}
