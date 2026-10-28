import type { DynamicIslandMetrics } from "@/types/desktop/dynamicIsland";

/** scale = 1 时主行高度；其余尺寸都按它等比换算，与 SPlayer-Next 的灵动岛比例一致。 */
const BASE_ROW_HEIGHT = 40;

export function computeDynamicIslandMetrics(scale: number): DynamicIslandMetrics {
  const rowHeight = Math.round(BASE_ROW_HEIGHT * scale);
  const coverSize = Math.round(rowHeight * 0.65);
  const fontSize = Math.max(13, Math.round(rowHeight * 0.5));
  const subFontSize = Math.max(11, Math.round(fontSize * 0.65));
  return {
    rowHeight,
    paddingX: Math.round(rowHeight * 0.4),
    gap: Math.round(rowHeight * 0.25),
    coverSize,
    coverRadius: Math.max(6, Math.round(coverSize * 0.35)),
    fontSize,
    subFontSize,
    subRowHeight: Math.round(subFontSize * 1.2),
    snapRadius: Math.round(rowHeight * 0.6),
  };
}

/** 胶囊除歌词外的固定宽度：左右内边距、封面与间距。 */
export function getDynamicIslandChromeWidth(metrics: DynamicIslandMetrics) {
  return metrics.paddingX * 2 + metrics.coverSize + metrics.gap;
}
