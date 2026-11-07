"use client";

import { useLayoutEffect } from "react";
import { PlaylistViewLoading } from "@/components/Playlist/lattice/PlaylistViewLoading";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { markPageLoadFlip } from "@/lib/playlist/flipReveal";
import { useLatticePreferences } from "@/store/module/lattice";

/** What a playlist page shows while a reload brings the app up: the wall it was left on, if any, which then flips in. */
export function PlaylistPageLoadSkeleton() {
  useLayoutEffect(() => {
    if (useLatticePreferences.getState().immersive) markPageLoadFlip();
  }, []);
  return (
    <>
      <PlaylistPageSkeleton />
      <PlaylistViewLoading arm={false} />
    </>
  );
}
