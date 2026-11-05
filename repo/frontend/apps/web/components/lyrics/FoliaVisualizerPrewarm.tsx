"use client";

import { useEffect } from "react";

// components/lyrics/FoliaVisualizerPrewarm.tsx
// 主窗口首屏出来、页面空闲后，让启动慢的歌词样式（雾笺的着色器）在后台先准备好。
// 只挂在主窗口：桌面歌词、灵动岛等辅助窗口不需要，也不该各自多建一个 WebGL 上下文。

/** 首屏出来后先等这么久再找空闲：启动时的加载、首屏的布局和图片解码先做完。 */
const IDLE_DELAY_MS = 2500;
/** 一直不空闲时最多再等这么久，到点照样调。 */
const IDLE_TIMEOUT_MS = 10_000;

export function FoliaVisualizerPrewarm() {
  useEffect(() => {
    let cancelled = false;
    let idleHandle: number | undefined;
    const start = () => {
      import("./folia/src/components/visualizer/prewarmVisualizers")
        .then((module) => {
          if (!cancelled) module.prewarmVisualizers();
        })
        .catch((error) => console.warn("[Visualizer] prewarm did not load", error));
    };
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleHandle = window.requestIdleCallback(start, { timeout: IDLE_TIMEOUT_MS });
      } else {
        start();
      }
    }, IDLE_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleHandle !== undefined) window.cancelIdleCallback?.(idleHandle);
    };
  }, []);

  return null;
}
