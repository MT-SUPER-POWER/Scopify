"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

export function usePlaylistLatticeView() {
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!container) return;
    container.dataset.latticeActive = "true";
    return () => {
      delete container.dataset.latticeActive;
    };
  }, [container]);
  const open = useCallback(() => {
    const host = contentRef.current?.closest<HTMLElement>("[data-dashboard-main]");
    if (!host) return;
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setContainer(host);
  }, []);
  const close = useCallback(() => {
    setContainer(null);
    requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    });
  }, []);
  return { contentRef, container, open, close };
}
