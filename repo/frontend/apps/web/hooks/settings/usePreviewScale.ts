"use client";

import { useEffect, useRef, useState } from "react";

export function usePreviewScale(width: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    observer.observe(container);
    return () => observer.disconnect();
  }, [width]);
  return { containerRef, scale };
}
