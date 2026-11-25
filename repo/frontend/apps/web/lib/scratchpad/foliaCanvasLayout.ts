// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import type { CanvasSpacing as Spacing } from "@/types/scratchpad/canvas";
export const NOTE_SPACING: Spacing = { x: 28, y: 56, edge: 10, card: { width: 184, height: 220 } };
export const PHOTO_SPACING: Spacing = { x: 28, y: 60, edge: 10, card: { width: 152, height: 188 } };
/** 评论页展开整页的目录卡（设计稿 G 组 CommentsSheet 的 172 × 214）。 */
export const CATALOG_SPACING: Spacing = {
  x: 28,
  y: 40,
  edge: 10,
  card: { width: 172, height: 214 },
};
/** 胶片宽是 28 的整数倍：齿孔每 28px 一个，一格接一格时间距接得上。 */
export const FILM_SPACING: Spacing = { x: 0, y: 56, edge: 28, card: { width: 196, height: 176 } };

export const NOTE_ROW_SPACING: Spacing = {
  x: 14,
  y: 44,
  edge: 10,
  card: { width: 104, height: 102 },
};
export const PHOTO_ROW_SPACING: Spacing = {
  x: 14,
  y: 48,
  edge: 10,
  card: { width: 92, height: 102 },
};
export const FILM_ROW_SPACING: Spacing = {
  x: 0,
  y: 48,
  edge: 28,
  card: { width: 112, height: 102 },
};
export const CATALOG_ROW_SPACING: Spacing = {
  x: 14,
  y: 44,
  edge: 10,
  card: { width: 132, height: 102 },
};

const OVERVIEW_ROW_BLOCK = 186;
/** 两行之间至少隔多少（一行的高度再留 14）。 */
export const OVERVIEW_ROW_MIN_STEP = 200;
/**
 * 窗口矮得连一行一行挨着都放不下时，行距最多再挤到多少：上一行卡片的底边压住下一行信息条顶上 24px（上面的行叠在上面）。
 * 四行比三行多要 186px，不让它挤，768 高的屏幕最后一行就出了窗口；挤到这里，716 高还放得下，再矮才出底边。
 */
export const OVERVIEW_ROW_TUCKED_STEP = OVERVIEW_ROW_BLOCK - 24;
/** 第一行最高到哪（让开窗口标题栏）、最后一行的卡离窗口底边至少多少。 */
const OVERVIEW_TOP_MIN = 36;
const OVERVIEW_BOTTOM_GAP = 8;
/** 四行在窗口里的比例位置（照设计稿 G 组 1440 × 900 时的 63 / 261 / 459 / 657，行距由 OVERVIEW_ROW_MIN_STEP 撑到 200）。 */
const OVERVIEW_ROW_RATIOS = [0.07, 0.29, 0.51, 0.73];

/**
 * 纸绕中心转 tilt 度时，离中线 offset（往右为正）处在屏幕上比中线低多少（px；往左是负的，比中线高）。
 * 内容安全区都按它算：越靠右的东西转下去越低，会出窗口底边。
 */
export const tiltDrop = (offset: number, tilt: number): number =>
  offset * Math.sin((tilt * Math.PI) / 180);

/** 总览每一行最右端（行尾那块「还有几首」，离纸右边约 200px）比中线低多少：排行时底下多留这一截。 */
export const overviewBottomInset = (sheetWidth: number, tilt: number): number =>
  Math.max(0, Math.ceil(tiltDrop(sheetWidth / 2 - 200, tilt)));

/**
 * 总览每一行信息条的顶边（窗口坐标，不含纸上下多出来的那一截）：按比例排；行与行至少隔 OVERVIEW_ROW_MIN_STEP；
 * 窗口矮到最后一行的卡出了底边时，先整体往上挪（不高过标题栏），还不够就把行距挤到正好一行高，再不够让行叠一点（OVERVIEW_ROW_TUCKED_STEP）。
 * bottomInset：底下另外让出来的高度（纸斜着时行的右端比中间低，见 overviewBottomInset）。
 */
export const overviewRowTops = (viewHeight: number, bottomInset = 0): number[] => {
  const tops = OVERVIEW_ROW_RATIOS.map((ratio) => ratio * viewHeight);
  for (let index = 1; index < tops.length; index += 1)
    tops[index] = Math.max(tops[index], tops[index - 1] + OVERVIEW_ROW_MIN_STEP);
  const room = viewHeight - OVERVIEW_BOTTOM_GAP - bottomInset;
  const last = tops.length - 1;
  const overflow = tops[last] + OVERVIEW_ROW_BLOCK - room;
  if (overflow <= 0) return tops;
  const shift = Math.min(overflow, Math.max(0, tops[0] - OVERVIEW_TOP_MIN));
  const shifted = tops.map((top) => top - shift);
  if (shifted[last] + OVERVIEW_ROW_BLOCK <= room) return shifted;
  const step = Math.max(OVERVIEW_ROW_TUCKED_STEP, (room - OVERVIEW_ROW_BLOCK - shifted[0]) / last);
  return shifted.map((_, index) => shifted[0] + index * step);
};

export const rowSpacing = {
  notes: NOTE_ROW_SPACING,
  queue: FILM_ROW_SPACING,
  history: PHOTO_ROW_SPACING,
  moments: CATALOG_ROW_SPACING,
} as const;
export const pageSpacing = {
  notes: NOTE_SPACING,
  queue: FILM_SPACING,
  history: PHOTO_SPACING,
  moments: CATALOG_SPACING,
} as const;
