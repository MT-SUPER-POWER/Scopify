"use client";

import { useUiStore } from "@/store/module/ui";
import LyricModalFrame from "./LyricModal/LyricModalFrame";


export default function LyricsModal() {
  const isLyricsOpen = useUiStore((s) => s.isLyricsOpen);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);

  return (
    <LyricModalFrame
      isOpen={isLyricsOpen}
      onClose={closeLyrics}
    >
    </LyricModalFrame>
  );
}
