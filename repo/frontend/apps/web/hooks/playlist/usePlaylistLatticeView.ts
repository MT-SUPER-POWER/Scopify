"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLatticePreferences, useLatticeView } from "@/store/module/lattice";
import type { PlaylistViewMode } from "@/types/playlist/lattice";

export function usePlaylistLatticeView() {
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [mode, setMode] = useState<PlaylistViewMode>(
    () => useLatticePreferences.getState().viewMode,
  );
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
  const open = useCallback((requested?: PlaylistViewMode) => {
    const preferences = useLatticePreferences.getState();
    const next = requested ?? preferences.viewMode;
    if (requested) preferences.setViewMode(requested);
    preferences.setImmersive(true);
    setMode(next);
    const host = contentRef.current?.closest<HTMLElement>("[data-dashboard-main]");
    if (!host) return;
    // Switching modes while open keeps the element that opened the view as the focus target.
    if (!host.dataset.latticeActive)
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setContainer(host);
  }, []);
  const close = useCallback(() => {
    useLatticePreferences.getState().setImmersive(false);
    setContainer(null);
    requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    });
  }, []);
  // Lets the global header and shortcut commands switch this page's view mode.
  useEffect(() => useLatticeView.getState().register({ open, close }), [open, close]);
  // A page opens straight into the immersive view the last page was left in, before it first paints.
  useLayoutEffect(() => {
    if (useLatticePreferences.getState().immersive) open();
  }, [open]);
  return { contentRef, container, mode, open, close };
}
