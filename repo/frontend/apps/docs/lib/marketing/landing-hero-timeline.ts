/** 前奏吸顶段的滚动距离（vh）：窗口升起 → 「原样都在」→ 镜头穿过窗口推向舞台。 */
export const HERO_STICKY_VH = 270;
/** 前奏章节的高度：吸顶滚动距离再加一屏。 */
export const HERO_SECTION_VH = HERO_STICKY_VH + 100;
/** 镜头开始往前推的位置（vh）。 */
export const HERO_PUSH_START_VH = 185;
/**
 * 歌词舞台比前奏提前吸顶的距离（vh）：镜头穿过窗口的最后这一段，
 * 远处的舞台已经亮起，两层画面叠在一起完成交接。
 */
export const HERO_STAGE_OVERLAP_VH = 40;

/** 把前奏吸顶段里的 vh 位置换算成 0–1 的滚动进度。 */
export const heroAt = (vh: number) => vh / HERO_STICKY_VH;
