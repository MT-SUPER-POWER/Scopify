"use client";

import { useEffect } from "react";

/**
 * Marks the page as fully covered by the lyric stage. The covered regions then skip style, layout and paint: without
 * this the home carousel and the player bar repaint under an opaque stage, and that work competes with the stage's own
 * frames. See `[data-under-lyric-stage]` in globals.css.
 */
export function useLyricStageCover(covers: boolean) {
  useEffect(() => {
    if (!covers) return;
    const root = document.documentElement;
    root.dataset.lyricStageCovers = "";
    return () => {
      delete root.dataset.lyricStageCovers;
    };
  }, [covers]);
}
