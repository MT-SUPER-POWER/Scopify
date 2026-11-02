import { match as matchPinyin } from "pinyin-pro";
import type {
  CommandSearchDocument,
  CommandSearchHit,
  CommandSearchRange,
  CommandUsageEntry,
  CommandUsageRecord,
} from "@/types/commandWorkspace/search";

type SearchField = "label" | "keywords" | "path" | "summary";

const FIELD_WEIGHTS: Record<SearchField, number> = {
  label: 1,
  keywords: 0.8,
  path: 0.6,
  summary: 0.5,
};

/** 各匹配方式的基础分：越接近“用户就是想要这个”越高。 */
const MATCH_SCORES = {
  exact: 1,
  prefix: 0.92,
  wordPrefix: 0.84,
  substring: 0.72,
  pinyinExact: 0.97,
  pinyinPrefix: 0.88,
  pinyinWord: 0.8,
  pinyin: 0.66,
  typo: 0.5,
  subsequence: 0.42,
} as const;

/** 使用频率只做加权，不压过相关度：最多相当于从“包含”提升到“前缀”。 */
const MAX_FRECENCY_BOOST = 18;
const FRECENCY_HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;
/** 拼音只匹配标题与路径：关键词里已有英文与同义词，且多音字（藏/传）在长关键词上容易误命中。 */
const PINYIN_FIELDS = new Set<SearchField>(["label", "path"]);
const WORD_BOUNDARY = /[\s·›/\-_:|,，、()（）]/;
const CJK = /[㐀-鿿]/;

interface TermMatch {
  score: number;
  ranges: CommandSearchRange[];
}

export function normalizeCommandSearchText(text: string) {
  return text.normalize("NFKC").toLocaleLowerCase();
}

export function tokenizeCommandSearchQuery(query: string) {
  return normalizeCommandSearchText(query).trim().split(/\s+/).filter(Boolean);
}

/** 近期、多次使用的命令更靠前：次数取对数，按半衰期衰减。 */
export function getCommandFrecency(entry: CommandUsageEntry | undefined, now: number) {
  if (!entry || entry.count <= 0) return 0;
  const age = Math.max(0, now - entry.lastUsedAt);
  return Math.log2(1 + entry.count) * 0.5 ** (age / FRECENCY_HALF_LIFE_MS);
}

/**
 * 命令面板的本地搜索：多词 AND，每个词在加权字段里取最佳匹配；
 * 支持前缀、词首、子串、拼音全拼/首字母、拼写容错与跳字（子序列）匹配。
 */
export function searchCommands<T>(
  items: readonly T[],
  toDocument: (item: T) => CommandSearchDocument,
  query: string,
  usage: CommandUsageRecord = {},
  now = Date.now(),
): CommandSearchHit<T>[] {
  const terms = tokenizeCommandSearchQuery(query);
  const hits: (CommandSearchHit<T> & { index: number; frecency: number })[] = [];

  items.forEach((item, index) => {
    const document = toDocument(item);
    const frecency = getCommandFrecency(usage[document.id], now);
    if (!terms.length) {
      hits.push({ item, index, frecency, score: frecency, labelRanges: [] });
      return;
    }
    const scored = scoreDocument(document, terms);
    if (!scored) return;
    const boost = Math.min(MAX_FRECENCY_BOOST, frecency * 6);
    hits.push({ item, index, frecency, score: scored.score + boost, labelRanges: scored.ranges });
  });

  return hits
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ item, score, labelRanges }) => ({ item, score, labelRanges }));
}

function scoreDocument(document: CommandSearchDocument, terms: string[]) {
  const label = normalizeCommandSearchText(document.label);
  let total = 0;
  const ranges: CommandSearchRange[] = [];
  for (const term of terms) {
    let best = 0;
    for (const field of Object.keys(FIELD_WEIGHTS) as SearchField[]) {
      const text = document[field];
      if (!text) continue;
      const termMatch = matchTerm(
        field === "label" ? label : normalizeCommandSearchText(text),
        term,
        PINYIN_FIELDS.has(field),
      );
      if (!termMatch) continue;
      const score = termMatch.score * FIELD_WEIGHTS[field];
      if (score > best) best = score;
      if (field === "label") ranges.push(...termMatch.ranges);
    }
    if (best === 0) return null;
    total += best;
  }
  let score = (total / terms.length) * 100;
  // 整个查询就是标题开头（如“设置”、“播放队列”）时额外加分，比多词零散命中更可信。
  const joined = terms.join(" ");
  if (label.startsWith(joined)) score += 6;
  // 类似 ES 的长度归一：命中占标题比例越高越具体，“设置”排在“Folia 设置”前面。
  const merged = mergeRanges(ranges);
  const covered = merged.reduce((sum, [start, end]) => sum + end - start, 0);
  if (label.length) score += 6 * Math.min(1, covered / label.length);
  return { score, ranges: merged };
}

function matchTerm(text: string, term: string, allowPinyin: boolean): TermMatch | null {
  if (text === term) return { score: MATCH_SCORES.exact, ranges: [[0, text.length]] };
  const index = text.indexOf(term);
  if (index === 0) return { score: MATCH_SCORES.prefix, ranges: [[0, term.length]] };
  if (index > 0) {
    const ranges: CommandSearchRange[] = [[index, index + term.length]];
    const atWord = WORD_BOUNDARY.test(text[index - 1]) || isScriptBoundary(text, index);
    return { score: atWord ? MATCH_SCORES.wordPrefix : MATCH_SCORES.substring, ranges };
  }
  return (
    (allowPinyin ? matchPinyinTerm(text, term) : null) ??
    matchTypo(text, term) ??
    matchSubsequence(text, term)
  );
}

function isScriptBoundary(text: string, index: number) {
  return CJK.test(text[index - 1]) !== CJK.test(text[index]);
}

/** “sz” → 设置、“mrtj” → 每日推荐、“bofang” → 播放：只对含汉字的文本、纯字母的词生效。 */
function matchPinyinTerm(text: string, term: string): TermMatch | null {
  if (!CJK.test(text) || !/^[a-z]+$/.test(term)) return null;
  const indices = matchPinyin(text, term, { precision: "start", continuous: true });
  if (!indices?.length) return null;
  const start = indices[0];
  const end = indices[indices.length - 1] + 1;
  const score =
    start === 0 && end === text.length
      ? MATCH_SCORES.pinyinExact
      : start === 0
        ? MATCH_SCORES.pinyinPrefix
        : WORD_BOUNDARY.test(text[start - 1])
          ? MATCH_SCORES.pinyinWord
          : MATCH_SCORES.pinyin;
  return { score, ranges: [[start, end]] };
}

/** 英文单词的拼写容错：4 个字母以上允许 1 处错，8 个以上允许 2 处。 */
function matchTypo(text: string, term: string): TermMatch | null {
  if (term.length < 4 || !/^[a-z]+$/.test(term)) return null;
  const allowed = term.length >= 8 ? 2 : 1;
  let offset = 0;
  for (const word of text.split(WORD_BOUNDARY)) {
    const start = text.indexOf(word, offset);
    offset = start + word.length;
    if (!word || Math.abs(word.length - term.length) > allowed) continue;
    const distance = editDistance(word, term);
    if (distance <= allowed)
      return {
        score: MATCH_SCORES.typo - 0.08 * (distance - 1),
        ranges: [[start, start + word.length]],
      };
  }
  return null;
}

/** 跳字匹配（“dyn isl”、“plq” → play queue）：越紧凑、越靠前分越高。 */
function matchSubsequence(text: string, term: string): TermMatch | null {
  if (term.length < 2) return null;
  const positions: number[] = [];
  let from = 0;
  for (const char of term) {
    const found = text.indexOf(char, from);
    if (found < 0) return null;
    positions.push(found);
    from = found + 1;
  }
  const span = positions[positions.length - 1] - positions[0] + 1;
  if (span > term.length * 4) return null;
  const compactness = term.length / span;
  const leading = positions[0] === 0 ? 0.08 : 0;
  return {
    score: MATCH_SCORES.subsequence * (0.6 + 0.4 * compactness) + leading,
    ranges: mergeRanges(positions.map((position) => [position, position + 1] as const)),
  };
}

/** Damerau–Levenshtein（相邻换位算一次）。 */
function editDistance(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const distances = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)),
  );
  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      distances[row][col] = Math.min(
        distances[row - 1][col] + 1,
        distances[row][col - 1] + 1,
        distances[row - 1][col - 1] + cost,
      );
      if (
        row > 1 &&
        col > 1 &&
        left[row - 1] === right[col - 2] &&
        left[row - 2] === right[col - 1]
      )
        distances[row][col] = Math.min(distances[row][col], distances[row - 2][col - 2] + 1);
    }
  }
  return distances[left.length][right.length];
}

function mergeRanges(ranges: readonly CommandSearchRange[]) {
  const sorted = [...ranges].sort((left, right) => left[0] - right[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged as CommandSearchRange[];
}
