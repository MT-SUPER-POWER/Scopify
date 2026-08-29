import type {
  AwlrcContainerTracks,
  LyricDisplayLine,
  LyricMetadata,
  LyricWord,
} from "@/types/lyrics";

const CONTAINER = /\[awlrc:(.+)\]/;
const LINE = /^\[(\d{1,3}(?::\d{1,3}){0,2})\.(\d{1,3})\](.*)$/;
const WORD = /<(\d+),(\d+)(?:,\d+)?>([^<]*)/g;
const CJK = /[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/gu;
const LATIN = /[A-Za-z]/g;

const decodeBase64Utf8 = (value: string) => {
  let padded = value.trim();
  while (padded.length % 4 !== 0) padded += "=";
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
};

export function extractAwlrcContainer(content?: string): AwlrcContainerTracks | null {
  const match = content?.match(CONTAINER);
  if (!match) return null;

  const tracks: AwlrcContainerTracks = {};
  for (const segment of match[1].split(",")) {
    const separator = segment.indexOf(":");
    if (separator <= 0) continue;
    const key = segment.slice(0, separator) as keyof AwlrcContainerTracks;
    if (!(["awlrc", "lrc", "rlrc", "tlrc"] as const).includes(key)) continue;
    try {
      const decoded = decodeBase64Utf8(segment.slice(separator + 1));
      if (decoded.trim()) tracks[key] = decoded;
    } catch {
      // A broken optional track must not prevent the other tracks from loading.
    }
  }

  if (tracks.rlrc) {
    const cjkCount = tracks.rlrc.match(CJK)?.length ?? 0;
    const latinCount = tracks.rlrc.match(LATIN)?.length ?? 0;
    if (cjkCount > latinCount) delete tracks.rlrc;
  }

  return Object.keys(tracks).length ? tracks : null;
}

const parseTimestampMs = (fields: string, fraction: string) => {
  const parts = fields.split(":").map(Number);
  while (parts.length < 3) parts.unshift(0);
  const [hours, minutes, seconds] = parts;
  return hours * 3_600_000 + minutes * 60_000 + seconds * 1_000 + Number(fraction);
};

const parseAlternateTrack = (content = "") => {
  const entries = new Map<number, string>();
  for (const rawLine of content.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const match = rawLine.trim().match(LINE);
    const text = match?.[3].trim();
    if (match && text) entries.set(parseTimestampMs(match[1], match[2]), text);
  }
  return entries;
};

export function parseAwlrcText(
  content: string,
  translation: string | undefined,
  romanization: string | undefined,
  metadata: LyricMetadata,
): LyricDisplayLine[] {
  const translations = parseAlternateTrack(translation);
  const romanizations = parseAlternateTrack(romanization);
  const drafts: LyricDisplayLine[] = [];

  for (const rawLine of content.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    const metadataMatch = trimmed.match(/^\[([A-Za-z]+):\s*(.*?)\]$/);
    if (metadataMatch) {
      const key = metadataMatch[1].toLowerCase();
      if (key === "ti") metadata.title = metadataMatch[2];
      if (key === "ar") metadata.artist = metadataMatch[2];
      if (key === "al") metadata.album = metadataMatch[2];
      if (key === "by") metadata.by = metadataMatch[2];
      continue;
    }

    const lineMatch = trimmed.match(LINE);
    if (!lineMatch) continue;
    const startTimeMs = parseTimestampMs(lineMatch[1], lineMatch[2]);
    const words: LyricWord[] = [];
    let text = "";
    let cursorMs = 0;
    WORD.lastIndex = 0;
    let wordMatch: RegExpExecArray | null;
    while ((wordMatch = WORD.exec(lineMatch[3])) !== null) {
      const offsetMs = Math.max(Number(wordMatch[1]), cursorMs);
      const durationMs = Math.max(Number(wordMatch[2]), 1);
      const wordText = wordMatch[3];
      words.push({
        endTimeMs: startTimeMs + offsetMs + durationMs,
        startTimeMs: startTimeMs + offsetMs,
        text: wordText,
      });
      cursorMs = offsetMs + durationMs;
      text += wordText;
    }
    if (!words.length || !text.trim()) continue;

    drafts.push({
      endTimeMs: startTimeMs + cursorMs,
      romanization: romanizations.get(startTimeMs),
      startTimeMs,
      text,
      translation: translations.get(startTimeMs),
      words,
    });
  }

  return drafts
    .sort((left, right) => left.startTimeMs - right.startTimeMs)
    .map((line, index, lines) => ({
      ...line,
      endTimeMs: Math.max(
        line.startTimeMs,
        Math.min(line.endTimeMs, lines[index + 1]?.startTimeMs ?? line.endTimeMs),
      ),
    }));
}
