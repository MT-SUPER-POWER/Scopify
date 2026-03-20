"use client";

import { AnimatePresence } from "framer-motion";
import { useUiStore } from "@/store/module/ui";
import { LyricModalContent } from "./LyricModal/LyricModalContent";

export default function LyricsModal() {
  const isLyricsOpen = useUiStore((s) => s.isLyricsOpen);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);

  return (
    <AnimatePresence>
      {isLyricsOpen && <LyricModalContent onClose={closeLyrics} />}
    </AnimatePresence>
  );
}
