"use client";

import { type RefObject, useEffect, useState } from "react";

export function useSidebarNarrow(containerRef: RefObject<HTMLDivElement | null>) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width <= 90);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return isNarrow;
}
