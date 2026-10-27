/** 固定字符窗口；按字素切分，避免截断 emoji、组合音标或代理对。 */
const VISIBLE_GRAPHEMES = 30;
const HOLD_MS = 1200;
const STEP_MS = 240;
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** 由播放进度驱动，暂停时停在当前窗口；首尾停留后循环。 */
export function getMacTrayLyricFrame(text: string, elapsedMs: number) {
  const characters = Array.from(segmenter.segment(text), ({ segment }) => segment);
  const distance = characters.length - VISIBLE_GRAPHEMES;
  if (distance <= 0) return { text, nextUpdateMs: null };

  const travelMs = distance * STEP_MS;
  const cycleMs = HOLD_MS * 2 + travelMs;
  const phase = Math.max(0, elapsedMs) % cycleMs;
  const offset = Math.min(distance, Math.max(0, Math.floor((phase - HOLD_MS) / STEP_MS) + 1));
  const nextUpdateMs =
    phase < HOLD_MS
      ? HOLD_MS - phase
      : offset < distance
        ? STEP_MS - ((phase - HOLD_MS) % STEP_MS)
        : cycleMs - phase;
  return { text: characters.slice(offset, offset + VISIBLE_GRAPHEMES).join(""), nextUpdateMs };
}
