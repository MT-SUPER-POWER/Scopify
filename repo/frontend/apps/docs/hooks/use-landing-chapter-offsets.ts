"use client";

import { useEffect, useState } from "react";

import type { LandingChapterId, LandingChapterOffset } from "@/types/marketing";

/** 量出各章节在页面中的真实位置，供迷你播放器绘制分段刻度与上一章 / 下一章跳转。 */
export function useLandingChapterOffsets() {
  const [offsets, setOffsets] = useState<LandingChapterOffset[]>([]);

  useEffect(() => {
    const measure = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const elements = document.querySelectorAll<HTMLElement>("[data-landing-chapter]");
      setOffsets(
        Array.from(elements, (element) => {
          // 与上一章叠在一起的章节可以声明锚点（vh），跳转时落在它真正亮起的位置。
          const anchorVh = Number(element.dataset.landingChapterAnchor ?? 0);
          const top =
            element.getBoundingClientRect().top +
            window.scrollY +
            (anchorVh / 100) * window.innerHeight;
          return {
            id: element.dataset.landingChapter as LandingChapterId,
            top,
            fraction: Math.min(1, top / maxScroll),
          };
        }),
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return offsets;
}
