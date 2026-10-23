"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useKitReducedMotion } from "@scopify/ui/scopify/components/folia-panel/motion";

export function useFoliaThemeCarousel(themeId: string, count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useKitReducedMotion();
  const [edges, setEdges] = useState({ canPrevious: false, canNext: false });

  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    const update = () => {
      const canPrevious = row.scrollLeft > 1;
      const canNext = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
      setEdges((previous) =>
        previous.canPrevious === canPrevious && previous.canNext === canNext
          ? previous
          : { canPrevious, canNext },
      );
    };
    const selected = row.querySelector<HTMLElement>('[data-selected="true"]');
    if (selected) {
      // Scroll only this strip, preserving the containing panel's vertical scroll position.
      const left =
        selected.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
      if (left < row.scrollLeft + 4) row.scrollLeft = Math.max(0, left - 4);
      else if (left + selected.offsetWidth > row.scrollLeft + row.clientWidth - 4)
        row.scrollLeft = left + selected.offsetWidth - row.clientWidth + 4;
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    row.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      row.removeEventListener("scroll", update);
    };
  }, [themeId, count]);

  return {
    ref,
    ...edges,
    overflowing: edges.canPrevious || edges.canNext,
    scroll: (direction: -1 | 1) => {
      const row = ref.current;
      row?.scrollBy({
        left: direction * Math.max(44, row.clientWidth * 0.8),
        behavior: reduced ? "instant" : "smooth",
      });
    },
  };
}
