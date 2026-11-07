"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { armFlipReveal, disarmFlipReveal, fadeOutWall } from "@/lib/playlist/flipReveal";
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
  // Showing the wall without any flip: a page opening straight into the view it was last left in.
  const enter = useCallback((next: PlaylistViewMode) => {
    setMode(next);
    const host = contentRef.current?.closest<HTMLElement>("[data-dashboard-main]");
    if (!host) return;
    // Switching modes while open keeps the element that opened the view as the focus target.
    if (!host.dataset.latticeActive)
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setContainer(host);
  }, []);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const exitRef = useRef<{ target: PlaylistViewMode; animations: Animation[] } | null>(null);
  const cancelExit = useCallback(() => {
    exitRef.current?.animations.forEach((animation) => animation.cancel());
    exitRef.current = null;
  }, []);
  // The user changing layout: the next wall flips in, so they see it arrive. The commit is flushed
  // because the flip stays armed only for the current task.
  const flipInto = useCallback(
    (next: PlaylistViewMode, keepTools: boolean) => {
      armFlipReveal(keepTools);
      flushSync(() => enter(next));
      disarmFlipReveal();
    },
    [enter],
  );
  const open = useCallback(
    (requested?: PlaylistViewMode) => {
      const preferences = useLatticePreferences.getState();
      const next = requested ?? preferences.viewMode;
      if (requested) preferences.setViewMode(requested);
      preferences.setImmersive(true);
      const host = contentRef.current?.closest<HTMLElement>("[data-dashboard-main]");
      if (!host?.dataset.latticeActive) {
        flipInto(next, false);
        return;
      }
      // Asked for another layout while the wall is clearing: it just retargets.
      if (exitRef.current) {
        exitRef.current.target = next;
        return;
      }
      if (next === modeRef.current) return;
      const wall = host.querySelector("[data-playlist-view]");
      // Still on the skeleton, or no motion wanted: nothing to clear, and the wall appears as it is.
      if (!wall || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        enter(next);
        return;
      }
      const animations = fadeOutWall(wall);
      const exit = { target: next, animations };
      exitRef.current = exit;
      void Promise.all(animations.map((animation) => animation.finished)).then(
        () => {
          if (exit.target !== modeRef.current) flipInto(exit.target, true);
          cancelExit();
        },
        () => undefined,
      );
    },
    [cancelExit, enter, flipInto],
  );
  const close = useCallback(() => {
    cancelExit();
    useLatticePreferences.getState().setImmersive(false);
    setContainer(null);
    requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    });
  }, [cancelExit]);
  // Lets the global header and shortcut commands switch this page's view mode.
  useEffect(() => useLatticeView.getState().register({ open, close }), [open, close]);
  // A page opens straight into the immersive view the last page was left in, before it first paints.
  useLayoutEffect(() => {
    const preferences = useLatticePreferences.getState();
    if (preferences.immersive) enter(preferences.viewMode);
  }, [enter]);
  useEffect(() => cancelExit, [cancelExit]);
  return { contentRef, container, mode, open, close };
}
