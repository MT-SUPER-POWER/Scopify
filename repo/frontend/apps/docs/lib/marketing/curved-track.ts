import type { LandingCurvedTrackLayout } from "@/types/marketing";

/** 曲面半径与视口宽度之比；越小弯得越厉害。 */
const RADIUS_RATIO = 0.72;
const MIN_RADIUS = 720;
/** 观众到屏幕正中的距离与半径之比；略大于 1 表示站在弧心稍后的位置。 */
const PERSPECTIVE_RATIO = 1.15;
/** 窄条越窄曲面越平滑，32px 左右已看不出折痕。 */
const TARGET_STRIP_WIDTH = 32;
const MIN_STRIP_COUNT = 10;
/** 转过这个角度（弧度）的内容已经在视野之外，直接隐藏。 */
export const MAX_VISIBLE_ANGLE = 1.15;
/** 卡片整体上移的距离，给下方的场景说明留位置。 */
export const CURVED_CARD_LIFT = 44;

/** 按视口尺寸排出曲面轨道：章节标题在左，六张场景卡片沿弧长依次排开。 */
export function computeCurvedTrackLayout(
  viewportWidth: number,
  viewportHeight: number,
  cardCount: number,
): LandingCurvedTrackLayout {
  const isWide = viewportWidth >= 768;
  const cardWidth = isWide
    ? Math.min(viewportWidth * 0.58, 960, (viewportHeight - 320) * 1.6)
    : viewportWidth * 0.82;
  const introWidth = Math.min(448, viewportWidth * 0.78);
  const gap = Math.max(28, viewportWidth * 0.05);
  const radius = Math.max(viewportWidth * RADIUS_RATIO, MIN_RADIUS);
  const introCenter = isWide ? -viewportWidth * 0.2 : 0;
  const firstCardCenter = introCenter + introWidth / 2 + gap + cardWidth / 2;
  const cardCenters = Array.from(
    { length: cardCount },
    (_, index) => firstCardCenter + index * (cardWidth + gap),
  );

  return {
    cardCenters,
    cardHeight: cardWidth / 1.6,
    cardWidth,
    introCenter,
    introWidth,
    perspective: radius * PERSPECTIVE_RATIO,
    radius,
    stripCount: Math.max(MIN_STRIP_COUNT, Math.ceil(cardWidth / TARGET_STRIP_WIDTH)),
    travel: cardCenters.at(-1) ?? 0,
    viewportHeight,
  };
}

/**
 * 把弧长坐标上的一点贴到内凹圆柱面的内侧：圆柱轴在观众一侧，
 * 越往两侧越向观众弯过来，并始终正对圆柱轴。
 */
export function placeOnCylinder(arc: number, radius: number) {
  const angle = arc / radius;
  const x = radius * Math.sin(angle);
  const z = radius * (1 - Math.cos(angle));
  return {
    angle,
    transform: `translate3d(${x.toFixed(2)}px, 0px, ${z.toFixed(2)}px) rotateY(${(-angle).toFixed(4)}rad)`,
  };
}
