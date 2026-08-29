import { useEffect, useState } from "react";

/** Tracks an element's own width so embedded Folia surfaces do not size from the whole display. */
export const useElementWidth = (ref: React.RefObject<HTMLElement | null>): number => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const updateWidth = () => {
      const nextWidth = Math.round(node.clientWidth);
      setWidth((current) => (current === nextWidth ? current : nextWidth));
    };
    updateWidth();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return width;
};
