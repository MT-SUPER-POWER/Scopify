import type { Line, Word } from "@/components/lyrics/folia/src/types";

export function formatArchiveTime(seconds: number) {
  const time = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}

export function archiveWordProgress(word: Word, time: number) {
  if (time < word.startTime) return 0;
  if (word.endTime <= word.startTime) return 1;
  return Math.max(0, Math.min(1, (time - word.startTime) / (word.endTime - word.startTime)));
}

// Preserve the original spacing and punctuation, including Latin text inside CJK lyrics.
export function archiveDisplayWords(line: Line): Word[] {
  const words: Word[] = [];
  let cursor = 0;
  for (const word of line.words) {
    if (!word.text) continue;
    const start = line.fullText.indexOf(word.text, cursor);
    if (start < 0) return [{ text: line.fullText, startTime: line.startTime, endTime: line.endTime }];
    const end = start + word.text.length;
    words.push({ ...word, text: line.fullText.slice(cursor, end) });
    cursor = end;
  }
  if (!words.length) return [{ text: line.fullText, startTime: line.startTime, endTime: line.endTime }];
  words[words.length - 1].text += line.fullText.slice(cursor);
  return words;
}
