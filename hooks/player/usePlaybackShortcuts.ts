"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store";
import { useTimeStore } from "@/store/module/time";
import { useUiStore } from "@/store/module/ui";

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
        if (useUiStore.getState().isLyricsOpen && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          seekRelative(5_000);
        } else {
          player.playNext();
        }
      } else if (event.code === "ArrowLeft") {
        if (useUiStore.getState().isLyricsOpen && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          seekRelative(-5_000);
        } else {
          player.playPrev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

function seekRelative(offsetMs: number) {
  const { currentTime, totalTime } = useTimeStore.getState();
  const nextTime = Math.min(totalTime, Math.max(0, currentTime + offsetMs));
  window.dispatchEvent(new CustomEvent("player-seek", { detail: nextTime }));
}
