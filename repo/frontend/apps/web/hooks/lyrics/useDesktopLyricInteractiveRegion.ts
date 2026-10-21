"use client";

import { useEffect } from "react";
import { runtime } from "@/lib/runtime";

export const DESKTOP_LYRIC_INTERACTIVE_ATTRIBUTE = "data-desktop-lyric-interactive";

/**
 * 锁定后整个小歌词窗口忽略鼠标事件，解锁按钮因此无法点击。
 * 渲染进程只负责把可交互区域（解锁按钮）的矩形上报给主进程，由主进程按光标位置决定
 * 窗口是否临时恢复可交互；不依赖转发的 mousemove / mouseleave，避免穿透切换时的伪事件让状态来回抖动。
 */
export function useDesktopLyricInteractiveRegion() {
  useEffect(() => {
    if (!runtime.isDesktop) return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(`[${DESKTOP_LYRIC_INTERACTIVE_ATTRIBUTE}]`),
    );
    let frame = 0;
    const report = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        runtime.desktopLyrics.sendCommand({
          type: "set-desktop-lyric-interactive-region",
          rects: elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              x: Math.floor(rect.left),
              y: Math.floor(rect.top),
              width: Math.ceil(rect.width),
              height: Math.ceil(rect.height),
            };
          }),
        });
      });
    };

    const observer = new ResizeObserver(report);
    for (const element of elements) {
      observer.observe(element);
      // 父容器尺寸变化会让工具栏位置改变，但工具栏自身尺寸不变。
      if (element.parentElement) observer.observe(element.parentElement);
    }
    window.addEventListener("resize", report);
    report();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", report);
      runtime.desktopLyrics.sendCommand({
        type: "set-desktop-lyric-interactive-region",
        rects: [],
      });
    };
  }, []);
}
