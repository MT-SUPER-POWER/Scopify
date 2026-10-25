"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDynamicIslandChromeWidth } from "@/lib/lyrics/dynamicIslandLayout";
import { measureTextWidth } from "@/lib/lyrics/textMeasure";
import { runtime } from "@/lib/runtime";
import type { DynamicIslandContent, DynamicIslandMetrics } from "@/types/dynamicIsland";

/** 回弹缓动峰值约超出 10%，展开期间命中区域多留一些，避免边缘被裁。 */
const SHAPE_OVERSHOOT = 1.15;
/** 展开动画结束后再把命中区域收紧到实际宽度。 */
const SHAPE_SETTLE_MS = 600;
/** 字体亚像素取整余量，避免临界宽度时出现省略号。 */
const TEXT_GUARD = 2;

/**
 * 计算胶囊歌词槽宽度与窗口高度，并上报主进程：高度直接改窗口，
 * 宽度只用于裁切透明窗口的命中区域——窗口本身不随每句歌词伸缩。
 */
export function useDynamicIslandLayout(shown: DynamicIslandContent, metrics: DynamicIslandMetrics) {
  const chromeWidth = getDynamicIslandChromeWidth(metrics);
  const [family] = useState(() => getComputedStyle(document.body).fontFamily);
  // 进度每帧都在变，宽度只跟文字和字号有关。
  const textWidth = useMemo(
    () =>
      Math.max(
        measureTextWidth(shown.main, `500 ${metrics.fontSize}px ${family}`),
        shown.sub ? measureTextWidth(shown.sub, `400 ${metrics.subFontSize}px ${family}`) : 0,
      ),
    [family, metrics.fontSize, metrics.subFontSize, shown.main, shown.sub],
  );
  const slotWidth =
    shown.main || shown.sub
      ? Math.max(1, Math.min(textWidth + TEXT_GUARD, window.innerWidth - chromeWidth))
      : 0;
  const pillWidth = chromeWidth + slotWidth;
  const height = metrics.rowHeight + (shown.sub ? metrics.subRowHeight : 0);
  const reportedShapeRef = useRef(0);

  useEffect(() => {
    runtime.dynamicIsland.sendCommand({ type: "set-dynamic-island-height", height });
  }, [height]);

  useEffect(() => {
    const report = (width: number) => {
      reportedShapeRef.current = Math.ceil(width);
      runtime.dynamicIsland.sendCommand({
        type: "set-dynamic-island-shape",
        width: reportedShapeRef.current,
      });
    };
    report(Math.max(reportedShapeRef.current, pillWidth * SHAPE_OVERSHOOT));
    const timer = window.setTimeout(() => report(pillWidth), SHAPE_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [pillWidth]);

  return { slotWidth, height };
}
