"use client";

import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense } from "react";

import { useUiStore } from "@/store/module/ui";

const LyricStage = lazy(() =>
  import("./LyricStage").then((module) => ({ default: module.LyricStage })),
);

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
          <Suspense fallback={null}>
            <LyricStage onClose={closeLyrics} />
          </Suspense>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
