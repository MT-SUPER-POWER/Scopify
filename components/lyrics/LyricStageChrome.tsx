"use client";

import {
  ChevronDown,
  Heart,
  MonitorSpeaker,
  Pause,
  Play,
  Settings2,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useState } from "react";

import { toggleCurrentSongLike } from "@/lib/player/toggleCurrentSongLike";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";

import { LyricStageSettings } from "./LyricStageSettings";

export function LyricStageChrome({ onClose }: { onClose: () => void }) {
  const [isModePickerOpen, setIsModePickerOpen] = useState(false);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isLiked = useUserStore((state) =>
    currentSong
      ? Array.isArray(state.likeListIDs)
        ? state.likeListIDs.map(Number).includes(currentSong.id)
        : false
      : false,
  );

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{currentSong?.name ?? ""}</p>
          <p className="mt-1 truncate text-xs text-white/55">
            {currentSong?.ar.map((artist) => artist.name).join(", ") ?? ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Desktop lyrics"
            aria-label="Desktop lyrics"
            onClick={() => void window.electronAPI?.toggleDesktopLyric()}
            className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MonitorSpeaker className="size-5" />
          </button>
          <button
            type="button"
            title="Lyrics settings"
            aria-label="Lyrics settings"
            onClick={() => setIsModePickerOpen((open) => !open)}
            className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Settings2 className="size-5" />
          </button>
          <button
            type="button"
            title="Close lyrics"
            aria-label="Close lyrics"
            onClick={onClose}
            className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronDown className="size-5" />
          </button>
        </div>
      </header>
      <LyricStageSettings isOpen={isModePickerOpen} setIsOpen={setIsModePickerOpen} />

      <footer className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-4">
        <button
          type="button"
          title="Previous"
          aria-label="Previous"
          onClick={() => void usePlayerStore.getState().playPrev()}
          className="p-2 text-white/70 transition-colors hover:text-white"
        >
          <SkipBack className="size-5" />
        </button>
        <button
          type="button"
          title="Play or pause"
          aria-label="Play or pause"
          onClick={() => usePlayerStore.getState().togglePlaying()}
          className="p-2 text-white transition-colors hover:text-cyan-100"
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </button>
        <button
          type="button"
          title="Next"
          aria-label="Next"
          onClick={() => void usePlayerStore.getState().playNext()}
          className="p-2 text-white/70 transition-colors hover:text-white"
        >
          <SkipForward className="size-5" />
        </button>
        <button
          type="button"
          title="Like"
          aria-label="Like"
          onClick={() => void toggleCurrentSongLike().catch(console.warn)}
          className={cn(
            "p-2 transition-colors",
            isLiked ? "text-rose-300" : "text-white/70 hover:text-white",
          )}
        >
          <Heart className={cn("size-5", isLiked && "fill-current")} />
        </button>
      </footer>
    </>
  );
}
