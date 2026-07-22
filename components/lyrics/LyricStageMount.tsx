"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useUiStore } from "@/store/module/ui";

import { LyricStage } from "./LyricStage";

const lyricStageEnterTransition = {
  type: "spring" as const,
  stiffness: 240,
  damping: 22,
  mass: 0.92,
};

const lyricStageExitTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.86,
};

export function LyricStageMount() {
  const isLyricsOpen = useUiStore((state) => state.isLyricsOpen);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);

  return (
    <AnimatePresence>
      {isLyricsOpen ? (
        <motion.div
          key="lyric-stage"
          initial={{ y: "100%", scale: 0.985 }}
          animate={{ y: 0, scale: 1, transition: lyricStageEnterTransition }}
          exit={{ y: "100%", scale: 0.985, transition: lyricStageExitTransition }}
          className="fixed inset-0 z-100"
        >
          <LyricStage onClose={closeLyrics} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
