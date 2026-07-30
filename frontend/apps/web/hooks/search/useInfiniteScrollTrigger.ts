import { useEffect, useRef } from "react";
import type { InfiniteScrollTriggerOptions } from "@/types/components/search";

export function useInfiniteScrollTrigger({ enabled, onIntersect }: InfiniteScrollTriggerOptions) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!enabled || !target) return;
    const root = target.closest<HTMLElement>("[data-radix-scroll-area-viewport]");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onIntersect();
      },
      { root, rootMargin: "320px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, onIntersect]);

  return targetRef;
}
