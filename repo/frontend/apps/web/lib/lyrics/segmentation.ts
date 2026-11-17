import { splitLyricGraphemes } from "@/components/lyrics/folia/src/utils/lyrics/graphemeTiming";
import { segmentTextWords } from "@/components/lyrics/folia/src/utils/lyrics/wordSegmentation";
import type { LyricDisplayLine } from "@/types/lyrics/model";

const CJK_WORD = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+$/u;
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}ー]/u;
const CHINESE_PARTICLES = new Set(
  "的 地 得 了 着 著 过 過 们 們 吗 嗎 呢 吧 啊 呀 啦 嘛 哦 喔 么 麼 嘅 咗 喇 囉".split(" "),
);
const CHINESE_NON_HOSTS = new Set(
  "和 与 與 跟 同 或 而 在 从 從 向 对 對 把 被 给 給 也 都 就 又 再 还 還 很 太 更 不 没 沒 是".split(
    " ",
  ),
);
const JAPANESE_PARTICLES = new Set(
  "は が の を に へ と で や も ね よ な か て から まで だけ って".split(" "),
);

/** Keep overrides scoped to the lyric text and timestamp that were edited. */
export function getLyricSegmentationLineKey(
  line: Pick<LyricDisplayLine, "startTimeMs" | "text" | "agentId" | "blockIndex">,
): string {
  return JSON.stringify([line.startTimeMs, line.text, line.agentId, line.blockIndex]);
}

/** Word breaks used for Hanabi's groups, with adjacent Chinese and Japanese particles attached. */
export function getDefaultLyricBoundaries(text: string, automatic: boolean): string[] {
  const pieces = segmentTextWords(text).map(({ segment }) => segment);
  if (!automatic) return pieces;

  const boundaries: string[] = [];
  let index = 0;
  while (index < pieces.length) {
    const piece = pieces[index];
    if (piece === undefined) break;
    if (!CJK_WORD.test(piece)) {
      boundaries.push(piece);
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < pieces.length && CJK_WORD.test(pieces[end] ?? "")) end += 1;
    const run = pieces.slice(index, end);
    const isJapanese = run.some((word) => KANA.test(word));
    const particles = isJapanese ? JAPANESE_PARTICLES : CHINESE_PARTICLES;
    const start = boundaries.length;
    for (const word of run) {
      const host = boundaries.at(-1);
      if (
        boundaries.length > start &&
        host &&
        particles.has(word) &&
        (isJapanese || !CHINESE_NON_HOSTS.has(host))
      ) {
        boundaries[boundaries.length - 1] = host + word;
      } else {
        boundaries.push(word);
      }
    }
    index = end;
  }
  return boundaries;
}

export function isValidLyricSegmentation(
  text: string,
  boundaries: unknown,
): boundaries is string[] {
  if (
    !Array.isArray(boundaries) ||
    !boundaries.length ||
    !boundaries.every((segment) => typeof segment === "string" && segment.length > 0) ||
    boundaries.join("") !== text
  ) {
    return false;
  }

  const graphemeOffsets = new Set<number>();
  let offset = 0;
  for (const grapheme of splitLyricGraphemes(text)) {
    offset += grapheme.length;
    graphemeOffsets.add(offset);
  }
  offset = 0;
  return boundaries.every((segment) => {
    offset += segment.length;
    return graphemeOffsets.has(offset);
  });
}
