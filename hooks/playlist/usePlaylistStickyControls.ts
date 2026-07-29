"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePrimaryScrollSurface } from "@/components/shared/NavigationScrollProvider";
import type { PlaylistStickyControlsOptions } from "@/types/playlist";

export function usePlaylistStickyControls({
  actionBarRef,
  enabled,
  sentinelRef,
  topOffset,
}: PlaylistStickyControlsOptions) {
  const scrollSurface = usePrimaryScrollSurface();
  const [actionBarHeight, setActionBarHeight] = useState(0);
  const [isActionVisible, setIsActionVisible] = useState(true);
  const [isSticky, setIsSticky] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) {
      setActionBarHeight(0);
      return;
    }

    const actionBar = actionBarRef.current;
    if (!actionBar) return;

    const syncHeight = () => {
      const nextHeight = Math.ceil(actionBar.getBoundingClientRect().height);
      setActionBarHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(actionBar);

    return () => observer.disconnect();
  }, [actionBarRef, enabled]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !scrollSurface || !sentinel) {
      setIsSticky(false);
      setIsActionVisible(true);
      return;
    }

    let previousScrollTop = scrollSurface.scrollTop;

    const syncStickyState = () => {
      const sentinelTop = sentinel.getBoundingClientRect().top;
      const stickyTop = scrollSurface.getBoundingClientRect().top + topOffset;
      const nextIsSticky = sentinelTop <= stickyTop;
      const nextScrollTop = scrollSurface.scrollTop;

      setIsSticky(nextIsSticky);
      if (!nextIsSticky || nextScrollTop <= previousScrollTop) {
        setIsActionVisible(true);
      } else {
        setIsActionVisible(false);
      }
      previousScrollTop = nextScrollTop;
    };

    syncStickyState();
    scrollSurface.addEventListener("scroll", syncStickyState, { passive: true });

    return () => scrollSurface.removeEventListener("scroll", syncStickyState);
  }, [enabled, scrollSurface, sentinelRef, topOffset]);

  return { actionBarHeight, isActionVisible, isSticky };
}
