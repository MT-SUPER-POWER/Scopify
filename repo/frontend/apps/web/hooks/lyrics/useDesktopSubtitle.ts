"use client";

import { useEffect } from "react";
import { useCompanionLyricLine } from "@/hooks/lyrics/useCompanionLyricLine";
import { computeDesktopLyricWindowHeight } from "@/lib/lyrics/desktopLyricLayout";
import { runtime } from "@/lib/runtime";
import { useAppearanceStore } from "@/store/module/appearance";

export function useDesktopSubtitle() {
  const line = useCompanionLyricLine();
  const settings = useAppearanceStore((state) => state.lyricsPreview);

  useEffect(() => {
    document.documentElement.classList.add("desktop-lyrics-html");
    document.body.classList.add("desktop-lyrics-body");
    return () => {
      document.documentElement.classList.remove("desktop-lyrics-html");
      document.body.classList.remove("desktop-lyrics-body");
    };
  }, []);

  const windowHeight = computeDesktopLyricWindowHeight(settings);
  useEffect(() => {
    runtime.desktopLyrics.sendCommand({ type: "set-desktop-lyric-height", height: windowHeight });
  }, [windowHeight]);

  return { ...line, settings };
}
