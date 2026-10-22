"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLatticeView } from "@/store/module/lattice";

export function usePlaylistLatticeView() {
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!container) return;
    container.dataset.latticeActive = "true";
    const { setActive } = useLatticeView.getState();
    setActive(true);
    return () => {
      delete container.dataset.latticeActive;
      setActive(false);
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
  // Lets the global header and shortcut commands switch this page's view mode.
  useEffect(() => useLatticeView.getState().register({ open, close }), [open, close]);
  return { contentRef, container, open, close };
}
