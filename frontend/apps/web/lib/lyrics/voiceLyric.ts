import type { NeteaseLyric } from "@/types/api/music";
import { getVoiceLyric } from "@/lib/api/voicelist";
import type { VoiceLyricDocument, VoiceLyricSentence } from "@/types/api/voicelist";

const MINIMUM_DURATION_MS = 1;

export async function getVoiceLyricDocument(voiceId: number): Promise<VoiceLyricDocument | null> {
  const lyricResponse = await getVoiceLyric(voiceId);
  const lyricUrl = lyricResponse.data.data?.lyricUrl;
  if (!lyricUrl || !isSupportedLyricUrl(lyricUrl)) return null;

  const response = await fetch(lyricUrl);
  if (!response.ok) throw new Error("Unable to fetch the voice transcript.");
  return response.json() as Promise<VoiceLyricDocument>;
}

/** Converts the voice transcript's sentence/syllable timeline to NetEase YRC. */
export function adaptVoiceLyricToNetease(document: VoiceLyricDocument): NeteaseLyric {
  const lines = (document.sents ?? []).flatMap((sentence) => {
    const line = toYrcLine(sentence);
    return line ? [line] : [];
  });

  return {
    code: 200,
    yrc: { lyric: lines.join("\n"), version: 1 },
  };
}

export async function getVoiceNeteaseLyric(voiceId: number): Promise<NeteaseLyric | null> {
  const document = await getVoiceLyricDocument(voiceId);
  return document ? adaptVoiceLyricToNetease(document) : null;
}

function isSupportedLyricUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toYrcLine(sentence: VoiceLyricSentence): string | null {
  if (!isValidRange(sentence.beg, sentence.end) || !sentence.name.trim()) return null;

  const duration = Math.max(MINIMUM_DURATION_MS, sentence.end - sentence.beg);
  const syllables = (sentence.sylls ?? []).flatMap((syllable) => {
    if (!isValidRange(syllable.beg, syllable.end) || !syllable.name) return [];
    return [
      `(${syllable.beg},${Math.max(MINIMUM_DURATION_MS, syllable.end - syllable.beg)},0)${syllable.name}`,
    ];
  });
  const words = syllables.length
    ? syllables.join("")
    : `(${sentence.beg},${duration},0)${sentence.name}`;

  return `[${sentence.beg},${duration}]${words}`;
}

function isValidRange(start: number, end: number) {
  return Number.isFinite(start) && Number.isFinite(end) && end >= start;
}
