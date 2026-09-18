import type { LyricDisplayLine } from "@/types/lyrics";

const HAN = /\p{Script=Han}/u;
const JAPANESE = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
const OTHER_SCRIPT = /[\p{Script=Latin}\p{Script=Hangul}]/u;

export function hasJapaneseLyrics(lines: LyricDisplayLine[]) {
  return lines.some((line) => JAPANESE.test(line.text));
}

export function isChineseSubtitleLine(line: LyricDisplayLine, japaneseLyrics: boolean) {
  return isChineseSubtitleText(line.text, line.translation, japaneseLyrics);
}

export function isChineseSubtitleText(source: string, target = "", japaneseLyrics = false) {
  if (japaneseLyrics || JAPANESE.test(source) || OTHER_SCRIPT.test(source)) return false;
  if (!HAN.test(source)) return false;

  // Kanji-only lyrics cannot establish the language. Keep a distinct Chinese
  // translation even when the rest of the song contains no kana either.
  const translation = target.trim();
  if (translation && HAN.test(translation) && translation !== source.trim()) return false;

  return true;
}
