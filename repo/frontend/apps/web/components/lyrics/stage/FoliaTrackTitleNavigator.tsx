"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlayerStore } from "@/store/module/player";

interface FoliaTrackTitleNavigatorProps {
  color: string;
  disabled?: boolean;
  fallback: string;
  isDaylight?: boolean;
}

export function FoliaTrackTitleNavigator({
  color,
  disabled = false,
  fallback,
  isDaylight = false,
}: FoliaTrackTitleNavigatorProps) {
  const commands = usePlaybackCommands();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const [hoverSide, setHoverSide] = useState<"prev" | "next" | null>(null);
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmSequence, setConfirmSequence] = useState(0);
  const [direction, setDirection] = useState<"prev" | "next">("next");
  const previous = queueIndex > 0 ? queue[queueIndex - 1] : null;
  const next = queueIndex >= 0 && queueIndex < queue.length - 1 ? queue[queueIndex + 1] : null;
  const preview = hoverSide === "prev" ? previous?.name : hoverSide === "next" ? next?.name : null;
  const displayTitle =
    pendingTitle ?? (!confirming ? preview : null) ?? currentSong?.name ?? fallback;

  useEffect(() => {
    setPendingTitle(null);
  }, [currentSong?.id]);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 1100);
    return () => window.clearTimeout(timer);
  }, [confirmSequence, confirming]);

  const switchTrack = (side: "prev" | "next") => {
    const target = side === "prev" ? previous : next;
    if (!target) return;
    setPendingTitle(target.name);
    setDirection(side);
    setConfirming(true);
    setConfirmSequence((sequence) => sequence + 1);
    if (side === "prev") void commands.previous();
    else void commands.next();
  };
  const arrowClass = `pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/title:opacity-70 hover:opacity-100 ${isDaylight ? "hover:bg-black/10" : "hover:bg-white/15"}`;

  return (
    <div className="group/title relative col-span-3 row-start-1 min-w-0 px-9 text-center text-sm font-bold select-none sm:col-span-1 sm:col-start-2">
      {!disabled && previous ? (
        <button
          aria-label={previous.name}
          className={`${arrowClass} absolute inset-y-0 left-1 my-auto`}
          onClick={(event) => {
            event.stopPropagation();
            switchTrack("prev");
          }}
          onMouseEnter={() => setHoverSide("prev")}
          onMouseLeave={() => setHoverSide(null)}
          style={{ color }}
          title={previous.name}
          type="button"
        >
          <ChevronLeft size={16} />
        </button>
      ) : null}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          animate={{ opacity: preview && !confirming ? 0.55 : 1, x: 0 }}
          className="truncate"
          exit={{ opacity: 0, x: direction === "prev" ? 12 : -12 }}
          initial={{ opacity: 0, x: direction === "prev" ? -12 : 12 }}
          key={displayTitle}
          style={{ color }}
        >
          {displayTitle}
        </motion.div>
      </AnimatePresence>
      {!disabled && next ? (
        <button
          aria-label={next.name}
          className={`${arrowClass} absolute inset-y-0 right-1 my-auto`}
          onClick={(event) => {
            event.stopPropagation();
            switchTrack("next");
          }}
          onMouseEnter={() => setHoverSide("next")}
          onMouseLeave={() => setHoverSide(null)}
          style={{ color }}
          title={next.name}
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      ) : null}
    </div>
  );
}
