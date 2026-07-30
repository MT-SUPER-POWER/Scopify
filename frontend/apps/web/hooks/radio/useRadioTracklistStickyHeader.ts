"use client";

import { useEffect, useRef, useState } from "react";

import { usePrimaryScrollSurface } from "@/components/shared/NavigationScrollProvider";

export function useRadioTracklistStickyHeader(stickyTop: number) {
  const scrollSurface = usePrimaryScrollSurface();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!scrollSurface || !sentinel) {
      setIsSticky(false);
      return;
    }

    const syncStickyState = () => {
      const stickyOffset = scrollSurface.getBoundingClientRect().top + stickyTop;
      setIsSticky(sentinel.getBoundingClientRect().top <= stickyOffset);
    };

    syncStickyState();
    scrollSurface.addEventListener("scroll", syncStickyState, { passive: true });

    return () => scrollSurface.removeEventListener("scroll", syncStickyState);
  }, [scrollSurface, stickyTop]);

  return { isSticky, sentinelRef };
}
