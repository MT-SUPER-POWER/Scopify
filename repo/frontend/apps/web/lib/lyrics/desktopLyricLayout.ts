import type { LyricsPreviewSettings } from "@/types/appearance/model";

/** 顶栏高度：左侧歌曲信息、中间播放控制、右侧锁定等按钮。 */
export const DESKTOP_LYRIC_HEADER_HEIGHT = 44;
/** 歌词区上下留白，给描边阴影和入场动画留余量。 */
const STAGE_PADDING_Y = 8;
/** 与 subtitle-capsule.module.css 的 line-height / margin / border 保持一致。 */
const SOURCE_LINE_HEIGHT = 1.5;
const TRANSLATION_LINE_HEIGHT = 1.4;
const TRANSLATION_GAP = 4;
const CAPSULE_BORDER = 1;

/** 横向滚动开始前停留的进度比例。 */
const MARQUEE_START_RATIO = 0.3;
/** 滚动到末尾后保留的最长停留时间。 */
const MARQUEE_END_MARGIN_MS = 2_000;
const MARQUEE_END_MARGIN_RATIO = 0.2;
/** 短句也能看清滚动过程的最短时长。 */
const MARQUEE_MIN_DURATION_MS = 1_200;

/**
 * 窗口高度只由字号等样式决定、与当前歌词无关：歌词单行显示、溢出横向滚动，
 * 所以换行和切歌都不会让窗口伸缩，顶栏上的锁定按钮位置保持稳定。
 */
export function computeDesktopLyricWindowHeight(settings: LyricsPreviewSettings) {
  const source = Math.ceil(settings.fontSize * SOURCE_LINE_HEIGHT);
  const translation = settings.showTranslation
    ? TRANSLATION_GAP + Math.ceil(settings.secondarySize * TRANSLATION_LINE_HEIGHT)
    : 0;
  const capsule = settings.paddingY * 2 + CAPSULE_BORDER * 2 + source + translation;
  return DESKTOP_LYRIC_HEADER_HEIGHT + STAGE_PADDING_Y * 2 + capsule;
}

/**
 * 计算超长单行歌词当前的横向偏移：先停留一段，再在本句时长内匀速滚到末尾。
 * @param elapsedMs - 本句已播放的时长
 * @param durationMs - 本句总时长
 * @param distance - 内容超出容器的像素
 */
export function computeMarqueeOffset(elapsedMs: number, durationMs: number, distance: number) {
  if (distance <= 0.5) return 0;
  const duration = Math.max(MARQUEE_MIN_DURATION_MS, durationMs);
  const endMargin = Math.min(MARQUEE_END_MARGIN_MS, duration * MARQUEE_END_MARGIN_RATIO);
  const motionDuration = Math.max(1, duration - endMargin);
  const progress = Math.max(0, Math.min(1, elapsedMs / motionDuration));
  if (progress <= MARQUEE_START_RATIO) return 0;
  return -distance * ((progress - MARQUEE_START_RATIO) / (1 - MARQUEE_START_RATIO));
}
