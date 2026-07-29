import type { LyricWord } from "@/types/lyrics";

const MINIMUM_LINE_DURATION_MS = 100;
const MINIMUM_WORD_DURATION_MS = 50;
const ACTIVE_DURATION_RATIO = 0.9;
const CJK_CHARACTER = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/;
const ZERO_WEIGHT_PUNCTUATION = /[，。！？、：；"'）]/;

interface SyntheticWordToken {
  text: string;
  weight: number;
}

export function buildSyntheticTimedWords(
  text: string,
  startTimeMs: number,
  endTimeMs: number,
): LyricWord[] {
  const durationMs = Math.max(endTimeMs - startTimeMs, MINIMUM_LINE_DURATION_MS);
  const tokens: SyntheticWordToken[] = [];
  let totalWeight = 0;

  for (const rawToken of text.split(/\s+/).filter(Boolean)) {
    if (CJK_CHARACTER.test(rawToken)) {
      for (const character of Array.from(rawToken)) {
        const weight = ZERO_WEIGHT_PUNCTUATION.test(character) ? 0 : 1;
        tokens.push({ text: character, weight });
        totalWeight += weight;
      }
      continue;
    }

    const weight = 1 + rawToken.length * 0.15;
    tokens.push({ text: rawToken, weight });
    totalWeight += weight;
  }

  const timePerWeightMs = (durationMs * ACTIVE_DURATION_RATIO) / Math.max(totalWeight, 1);
  let currentWordStartTimeMs = startTimeMs;
  const words = tokens.map<LyricWord>((token) => {
    const weightedDurationMs = token.weight * timePerWeightMs;
    const word: LyricWord = {
      endTimeMs: currentWordStartTimeMs + Math.max(weightedDurationMs, MINIMUM_WORD_DURATION_MS),
      startTimeMs: currentWordStartTimeMs,
      text: token.text,
    };

    currentWordStartTimeMs += token.weight > 0 ? weightedDurationMs : MINIMUM_WORD_DURATION_MS;
    return word;
  });

  const finalWord = words.at(-1);
  if (finalWord && finalWord.endTimeMs > endTimeMs) {
    const scale = (endTimeMs - startTimeMs) / (finalWord.endTimeMs - startTimeMs);
    return words.map((word) => ({
      ...word,
      endTimeMs: startTimeMs + (word.endTimeMs - startTimeMs) * scale,
      startTimeMs: startTimeMs + (word.startTimeMs - startTimeMs) * scale,
    }));
  }

  return words;
}
