import { useLayoutEffect, useRef, useState } from "react";

/** Measure complete grid rows instead of cutting through covers with a fixed height. */
export function useSectionCollapse(
  collapsedHeight: string,
  collapsedRows: number | undefined,
  isOpen: boolean,
) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(collapsedHeight);
  const [hasCollapsedOverflow, setHasCollapsedOverflow] = useState(true);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const update = () => {
      const contentRect = content.getBoundingClientRect();
      let limit = Number.parseFloat(collapsedHeight);
      const items = Array.from(content.querySelectorAll<HTMLElement>("[data-section-item]"));
      if (collapsedRows && items.length) {
        let row = 0;
        let previousTop = -Infinity;
        limit = 0;
        for (const item of items) {
          const rect = item.getBoundingClientRect();
          const top = rect.top - contentRect.top;
          if (Math.abs(top - previousTop) > 1) {
            row += 1;
            previousTop = top;
          }
          if (row <= collapsedRows) limit = Math.max(limit, rect.bottom - contentRect.top);
          item.inert = !isOpen && row > collapsedRows;
        }
      }
      setHeight(`${limit}px`);
      setHasCollapsedOverflow(contentRect.height > limit + 1);
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(content);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(content, { childList: true, subtree: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      content.querySelectorAll<HTMLElement>("[data-section-item]").forEach((item) => {
        item.inert = false;
      });
    };
  }, [collapsedHeight, collapsedRows, isOpen]);

  return { contentRef, hasCollapsedOverflow, height };
}
