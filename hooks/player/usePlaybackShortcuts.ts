"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

export function usePlaybackShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) return;

      const player = usePlayerStore.getState();
      if (event.code === "Space") {
        event.preventDefault();
        player.togglePlaying();
      } else if (event.code === "ArrowRight") {
        player.playNext();
      } else if (event.code === "ArrowLeft") {
        player.playPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
