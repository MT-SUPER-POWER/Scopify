import type { LyricDisplayLine } from "@/types/lyrics";

const HAN = /\p{Script=Han}/u;
const JAPANESE = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
const OTHER_SCRIPT = /[\p{Script=Latin}\p{Script=Hangul}]/u;

export function hasJapaneseLyrics(lines: LyricDisplayLine[]) {
  return lines.some((line) => JAPANESE.test(line.text));
}

export function isChineseSubtitleLine(line: LyricDisplayLine, japaneseLyrics: boolean) {
  if (japaneseLyrics || JAPANESE.test(line.text) || OTHER_SCRIPT.test(line.text)) return false;
  if (!HAN.test(line.text)) return false;

  // Kanji-only lyrics cannot establish the language. Keep a distinct Chinese
  // translation even when the rest of the song contains no kana either.
  const translation = line.translation?.trim();
  if (translation && HAN.test(translation) && translation !== line.text.trim()) return false;

  return true;
}
