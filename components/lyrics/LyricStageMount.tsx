"use client";

import { useUiStore } from "@/store/module/ui";

import { LyricStage } from "./LyricStage";

export function LyricStageMount() {
  const isLyricsOpen = useUiStore((state) => state.isLyricsOpen);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);

  return isLyricsOpen ? <LyricStage onClose={closeLyrics} /> : null;
}
