"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLatticePreferences } from "@/store/module/lattice";
import { PlaylistViewSkeleton } from "./PlaylistViewSkeleton";

/**
 * For a page that is still loading before it can mount its immersive view (the album page): if the
 * last view left open was an immersive one, cover the content pane with its skeleton instead of the
 * list's, so the page does not flash a list on the way into the view.
 */
export function PlaylistViewLoading() {
  const immersive = useLatticePreferences((state) => state.immersive);
  const mode = useLatticePreferences((state) => state.viewMode);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setHost(anchorRef.current?.closest<HTMLElement>("[data-dashboard-main]") ?? null);
  }, []);
  return (
    <>
      <div ref={anchorRef} hidden />
      {immersive && host && createPortal(<PlaylistViewSkeleton mode={mode} />, host)}
    </>
  );
}
