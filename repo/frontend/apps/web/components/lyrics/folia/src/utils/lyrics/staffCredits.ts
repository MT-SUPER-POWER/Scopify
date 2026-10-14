import type { Line } from "../../types";

// src/utils/lyrics/staffCredits.ts
// 识别歌词中的制作人员（staff / credits）署名行，为纯音乐判定及前置署名过滤提供判据。

const STAFF_ROLE_KEYWORDS = [
  "作词",
  "作曲",
  "词",
  "曲",
  "编曲",
  "制作人",
  "演唱",
  "吉他",
  "贝斯",
  "混音",
  "母带",
  "录音",
  "监制",
  "出品",
  "策划",
  "统筹",
  "设计",
  "宣传",
  "运营",
  "总监",
  "鸣谢",
  "工作室",
  "版权",
  "发行",
  "艺人统筹",
  "制作总监",
  "总顾问",
  "出品人",
  "总监制",
  "战略",
  "视觉",
  "资产管理",
  "总策划",
  "音乐总监",
  "制作统筹",
  "音乐版权",
  "创意顾问",
  "平面设计",
  "宣传物料",
  "黑胶设计",
  "项目总统筹",
  "艺人协力",
  "项目协力",
  "策略行销",
  "视觉统筹",
  "媒介",
  "宣传营销",
  "联合出品",
  "协办单位",
  "宣发合作伙伴",
  "独家短视频平台",
  "主题歌音乐专辑工作团队",
  "工作室负责人",
  "协作",
  "平面摄影师",
  "海报设计团队",
  "企划",
  "和声编写",
  "画师",
  "场景画师",
  "PV底图",
  "美工",
  "题字",
  "视频",
  "人声后期",
  "PV",
  "封面",
  "单曲封面",
  "单曲封面及标准字设计",
  "单曲封面摄影",
  "歌词字幕",
  "歌手",
  "原唱",
  // 常见补充：和声 / 弦乐 / 键盘 / 鼓 与常见版权缩写
  "和声",
  "弦乐",
  "键盘",
  "鼓",
  "制作",
  // 英文字段
  "Producer",
  "Composer",
  "Lyricist",
  "Arranger",
  "Vocal",
  "Guitar",
  "Bass",
  "Mixing",
  "Mastering",
  "Recording",
  "Arrangement",
  "Lyrics",
  "Music",
];

// 无冒号但语义明确的英文署名写法。
const STAFF_BY_PREFIX =
  /^\s*(?:produced|written|composed|arranged|mixed|mastered|recorded|performed)\s+by\s+\S/i;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const KEYWORD_GROUP = `(?:${STAFF_ROLE_KEYWORDS.map(escapeRegExp).join("|")})`;
const LATIN_ALIAS = `(?:\\s*[A-Za-z][A-Za-z0-9 .&'/-]*)?`;
const BUILT_IN_STAFF_PATTERN = `^\\s*[\\[（(【]?\\s*${KEYWORD_GROUP}(?:\\s*[/、&+,，·・和]?\\s*${KEYWORD_GROUP})*${LATIN_ALIAS}\\s*[\\]）)】]?\\s*[:：]\\s*\\S`;

export const LYRIC_STAFF_PATTERN_EXAMPLE = "^(?:作词|作曲|编曲|制作人|混音|母带)\\s*[:：]";

const builtInStaffRegex = new RegExp(BUILT_IN_STAFF_PATTERN, "i");

// 无冒号的署名写法（“编曲 某某”“Music by Foo”）：词表项必须是第一个空白前的整段，后面再跟内容。
const SPACED_STAFF_REGEX = new RegExp(
  `^\\s*${KEYWORD_GROUP}(?:\\s*[/、&+,，·・和]\\s*${KEYWORD_GROUP})*\\s+\\S`,
  "i",
);

/**
 * 判断是否为无冒号的空格分隔署名行（例如「编曲 某某」）。
 */
export const isSpacedStaffLine = (line: Pick<Line, "fullText"> | { fullText?: string }): boolean =>
  SPACED_STAFF_REGEX.test(line.fullText?.trim() || "");

/**
 * 创建署名匹配函数，支持传入自定义正则表达式覆盖内置词表。
 */
export const createStaffCreditMatcher = (
  pattern?: string | null,
): ((line: Pick<Line, "fullText"> | { fullText?: string }) => boolean) => {
  const normalized = pattern?.trim() || "";
  let custom: RegExp | null = null;

  if (normalized) {
    try {
      custom = new RegExp(normalized, "i");
    } catch {
      custom = null;
    }
  }

  return (line: Pick<Line, "fullText"> | { fullText?: string }): boolean => {
    const text = line.fullText?.trim() || "";
    if (!text) {
      return false;
    }

    if (custom) {
      return custom.test(text);
    }

    return builtInStaffRegex.test(text) || STAFF_BY_PREFIX.test(text);
  };
};

const FILLER_REGEX = /^[^\p{L}\p{N}]+$/u;

/**
 * 判断是否为纯符号短占位行（例如「#」、「//」、「---」）。
 */
export const isFillerLine = (line: Pick<Line, "fullText"> | { fullText?: string }): boolean => {
  const text = line.fullText?.trim() || "";
  return !text || (text.length <= 8 && FILLER_REGEX.test(text));
};

const COLON_SHAPED_REGEX = /^[^:：，。！？；…!?]{1,60}[:：]\s*\S/;

/**
 * 判断是否为带有冒号的键值结构元数据行。
 */
export const isColonShaped = (line: Pick<Line, "fullText"> | { fullText?: string }): boolean =>
  COLON_SHAPED_REGEX.test(line.fullText?.trim() || "");
