"use client";

import { useEffect, useState } from "react";
import { measureTextWidth } from "@/lib/lyrics/textMeasure";
import { runtime } from "@/lib/runtime";
import type { TaskbarLyricContentWidthOptions } from "@/types/desktop/taskbarLyric";

/** 外层左右内边距、歌词区左右外边距、封面内边距之和。 */
const CHROME_WIDTH = 12 + 8;
/** 字体亚像素取整与逐字渐变的余量，避免临界宽度误触发滚动。 */
const TEXT_GUARD = 8;
const SECONDARY_SCALE = 0.82;

/**
 * 上报歌词实际需要的宽度，主进程据此裁切命中区域（“按歌词长度收缩”时空白处点击回到任务栏）。
 * 悬停时上报全宽，给播放控制和歌曲信息留出空间。
 */
export function useTaskbarLyricContentWidth({
  items,
  fontSize,
  showCover,
  hovered,
  maxWidth,
}: TaskbarLyricContentWidthOptions) {
  const [family] = useState(() => getComputedStyle(document.body).fontFamily);
  // canvas 测量只需微秒级，逐帧算也无妨；effect 只在宽度数值变化时才发 IPC。
  const textWidth = Math.max(
    0,
    ...items.map((item) =>
      measureTextWidth(
        item.text,
        `${item.role === "secondary" ? fontSize * SECONDARY_SCALE : fontSize}px ${family}`,
      ),
    ),
  );

  useEffect(() => {
    if (maxWidth === null) return;
    const coverWidth = showCover ? window.innerHeight - 8 : 0;
    const natural = CHROME_WIDTH + coverWidth + textWidth + TEXT_GUARD;
    const width = Math.ceil(hovered ? maxWidth : Math.min(maxWidth, natural));
    runtime.taskbarLyric.sendCommand({ type: "set-taskbar-lyric-content-width", width });
  }, [hovered, maxWidth, showCover, textWidth]);
}
