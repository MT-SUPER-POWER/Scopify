"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 根据容器宽度计算瀑布流列数：每列不窄于 minColumnWidth。
 * 首帧未测量时使用 fallback，避免空白闪烁。
 */
export function useMasonryColumns<T extends HTMLElement>(
  minColumnWidth: number,
  gap: number,
  fallback = 3,
) {
  const ref = useRef<T>(null);
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = (width: number) => {
      setCount(Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap))));
    };
    update(element.clientWidth);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [minColumnWidth, gap]);

  return { ref, count };
}
