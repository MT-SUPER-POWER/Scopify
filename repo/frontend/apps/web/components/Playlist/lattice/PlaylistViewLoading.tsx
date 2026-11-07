"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLatticePreferences } from "@/store/module/lattice";
import { PlaylistViewSkeleton } from "./PlaylistViewSkeleton";

/**
 * For a page that is still loading before it can mount its immersive view: if the last view left
 * open was an immersive one, cover the content pane with its skeleton instead of the list's, so the
 * page does not flash a list on the way into the view. `arm` as on PlaylistViewSkeleton.
 *
 * The wall needs the pane's size, so it cannot be in the static HTML; until this mounts the boot
 * script's attribute holds the pane empty rather than letting the list skeleton show first.
 */
export function PlaylistViewLoading({ arm = true }: { arm?: boolean }) {
  const immersive = useLatticePreferences((state) => state.immersive);
  const mode = useLatticePreferences((state) => state.viewMode);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    setHost(anchorRef.current?.closest<HTMLElement>("[data-dashboard-main]") ?? null);
    setMounted(true);
  }, []);
  return (
    <>
      <div ref={anchorRef} hidden />
      {!mounted && (
        <div
          aria-hidden
          className="absolute inset-0 z-15 hidden bg-card [html[data-boot-playlist-view=true]_&]:block"
        />
      )}
      {immersive && host && createPortal(<PlaylistViewSkeleton mode={mode} arm={arm} />, host)}
    </>
  );
}
