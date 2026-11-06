"use client";

import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useState } from "react";

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
  // Set once the stage has finished sliding in, and cleared as soon as it starts to leave.
  const [hasEntered, setHasEntered] = useState(false);
  if (!isLyricsOpen && hasEntered) setHasEntered(false);

  return (
    <AnimatePresence>
      {isLyricsOpen ? (
        <motion.div
          key="lyric-stage"
          initial={{ y: "100%", scale: 0.985 }}
          animate={{ y: 0, scale: 1, transition: lyricStageEnterTransition }}
          exit={{ y: "100%", scale: 0.985, transition: lyricStageExitTransition }}
          onAnimationComplete={() => setHasEntered(useUiStore.getState().isLyricsOpen)}
          className="fixed inset-0 z-100"
        >
          <Suspense fallback={null}>
            <LyricStage hasEntered={hasEntered} onClose={closeLyrics} />
          </Suspense>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
