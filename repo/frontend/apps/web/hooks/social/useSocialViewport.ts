"use client";

import { useEffect, useRef } from "react";
import { useNavigationScroll } from "@/components/shared/NavigationScrollProvider";

/** Size the stationary rail against the actual dashboard viewport, including the player chrome. */
export function useSocialViewport() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollElement } = useNavigationScroll();
  useEffect(() => {
    const page = ref.current;
    if (!page || !scrollElement) return;
    const resize = () =>
      page.style.setProperty("--social-viewport-height", `${scrollElement.clientHeight}px`);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [scrollElement]);
  return ref;
}
