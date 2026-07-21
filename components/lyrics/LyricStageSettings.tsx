"use client";

import { Captions, Languages, Type } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { LYRIC_VISUALIZER_OPTIONS } from "@/constants/lyrics";
import { cn } from "@/lib/utils";
import { useLyricStageStore } from "@/store/module/lyrics";

export function LyricStageSettings({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const {
    fontScale,
    mode,
    setFontScale,
    setMode,
    setShowRomanization,
    setShowTranslation,
    showRomanization,
    showTranslation,
  } = useLyricStageStore();

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute top-16 right-4 z-30 w-64 border border-white/15 bg-black/80 p-2 shadow-2xl backdrop-blur-xl"
        >
          <div className="grid grid-cols-3 gap-1">
            {LYRIC_VISUALIZER_OPTIONS.map((option) => (
              <button
                key={option.mode}
                type="button"
                onClick={() => {
                  setMode(option.mode);
                  setIsOpen(false);
                }}
                className={cn(
                  "min-h-12 px-1 text-xs transition-colors",
                  mode === option.mode
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <button
              type="button"
              title="Toggle translation"
              aria-label="Toggle translation"
              onClick={() => setShowTranslation(!showTranslation)}
              className={cn("p-2", showTranslation ? "text-white" : "text-white/35")}
            >
              <Captions className="size-4" />
            </button>
            <button
              type="button"
              title="Toggle romanization"
              aria-label="Toggle romanization"
              onClick={() => setShowRomanization(!showRomanization)}
              className={cn("p-2", showRomanization ? "text-white" : "text-white/35")}
            >
              <Languages className="size-4" />
            </button>
            <button
              type="button"
              title="Smaller lyrics"
              aria-label="Smaller lyrics"
              onClick={() => setFontScale(fontScale - 0.1)}
              className="p-2 text-white/70 hover:text-white"
            >
              <Type className="size-3.5" />
            </button>
            <button
              type="button"
              title="Larger lyrics"
              aria-label="Larger lyrics"
              onClick={() => setFontScale(fontScale + 0.1)}
              className="p-2 text-white hover:text-white/70"
            >
              <Type className="size-5" />
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
