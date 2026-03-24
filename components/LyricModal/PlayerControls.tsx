"use client";

import { usePlayerStore } from "@/store";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle } from "lucide-react";

export const PlayerControls = () => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);

  return (
    <div className="mt-4 flex items-center justify-between w-full">
      <button onClick={toggleShuffle} className="p-2 relative group active:scale-95 transition-transform">
        <Shuffle className={cn("w-5 h-5 transition-colors", isShuffle ? "text-[#1ed760]" : "text-white/50 group-hover:text-white")} />
        {isShuffle && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />}
      </button>

      <div className="flex items-center gap-6 lg:gap-8">
        <button onClick={playPrev} className="text-white/80 hover:text-white transition-colors active:scale-90">
          <SkipBack className="w-8 h-8 lg:w-9 lg:h-9 fill-current" />
        </button>
        {/* Spotify 标志性设计：大尺寸纯白实心播放键 */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {isPlaying
            ? <Pause className="w-8 h-8 lg:w-10 lg:h-10 fill-current" />
            : <Play className="w-8 h-8 lg:w-10 lg:h-10 fill-current ml-1" />}
        </button>
        <button onClick={playNext} className="text-white/80 hover:text-white transition-colors active:scale-90">
          <SkipForward className="w-8 h-8 lg:w-9 lg:h-9 fill-current" />
        </button>
      </div>

      <button
        onClick={() => {
          const modes = ["off", "all", "one"] as const;
          const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
          setRepeatMode(next);
        }}
        className="p-2 relative group active:scale-95 transition-transform"
      >
        {repeatMode === "one"
          ? <Repeat1 className="w-5 h-5 text-[#1ed760]" />
          : <Repeat className={cn("w-5 h-5 transition-colors", repeatMode === "all" ? "text-[#1ed760]" : "text-white/50 group-hover:text-white")} />}
        {repeatMode !== "off" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />}
      </button>
    </div>
  );
};
