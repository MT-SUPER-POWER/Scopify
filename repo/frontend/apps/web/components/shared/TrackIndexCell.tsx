"use client";

import { Pause, Play } from "lucide-react";

import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { cn } from "@/lib/utils";

interface TrackIndexCellProps {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

export function TrackIndexCell({
  index,
  isActive,
  isPlaying,
  onPlay,
  setIsPlaying,
}: TrackIndexCellProps) {
  return (
    <div className="group/cell relative flex size-4 items-center justify-center">
      <span
        className={cn("font-normal text-content-muted group-hover:hidden", isActive && "hidden")}
      >
        {index + 1}
      </span>

      {isActive && isPlaying && <PlayingAnimation className="h-3 group-hover:hidden" />}

      {isActive && !isPlaying && (
        <Play className="size-4 fill-current text-brand group-hover:hidden" />
      )}

      <div className="hidden items-center justify-center group-hover:flex">
        {isActive && isPlaying ? (
          <Pause
            className="size-4 cursor-pointer fill-current text-brand"
            onClick={() => setIsPlaying(false)}
          />
        ) : (
          <Play className="size-4 cursor-pointer fill-current text-content" onClick={onPlay} />
        )}
      </div>
    </div>
  );
}
