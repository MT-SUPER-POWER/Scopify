"use client";

import { ListPlus, Pause, Play, Plus } from "lucide-react";
import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import type { SongDetail } from "@/types/api/music";
import type { CommandWorkspaceTrackListProps } from "@/types/commandWorkspace";

export function CommandWorkspaceTrackList({
  onAppend,
  onInsertNext,
  onPlay,
  trackList,
}: CommandWorkspaceTrackListProps) {
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  const handleTrackClick = (track: SongDetail, index: number) => {
    if (currentSong && currentSong.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      onPlay(index);
    }
  };

  return (
    <ScrollArea className="h-[min(58vh,36rem)]">
      <div className="space-y-0.5 px-2.5 py-2">
        <div className="flex items-start justify-between gap-4 px-3.5 py-2.5">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white">{trackList.title}</h3>
            {trackList.description ? (
              <p className="truncate text-xs text-zinc-400">{trackList.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onPlay(0)}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200"
          >
            <Play className="size-3.5 fill-current" />
            播放全部
          </button>
        </div>
        {trackList.tracks.map((track, index) => {
          const isCurrent = currentSong && track.id === currentSong.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <div
              key={`${track.voiceId ?? "song"}-${track.id}-${index}`}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3.5 py-2 transition-colors",
                isCurrent ? "bg-white/10" : "hover:bg-white/6",
              )}
            >
              <div className="flex w-5 shrink-0 items-center justify-end">
                {isCurrentPlaying ? (
                  <>
                    <PlayingAnimation size={14} className="group-hover:hidden" />
                    <Pause className="hidden size-3.5 fill-white text-white group-hover:block" />
                  </>
                ) : (
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      isCurrent ? "font-semibold text-brand" : "text-zinc-500",
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleTrackClick(track, index)}
                className="min-w-0 flex-1 text-left"
              >
                <span
                  className={cn(
                    "block truncate text-sm font-medium transition-colors hover:underline",
                    isCurrent ? "font-semibold text-brand" : "text-white hover:text-brand",
                  )}
                >
                  {track.name}
                </span>
                <span className="block truncate text-xs text-zinc-400">
                  {track.ar.map((artist) => artist.name).join(" / ")}
                </span>
              </button>
              <span className="text-xs text-zinc-500 tabular-nums">{formatDuration(track.dt)}</span>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onAppend(track)}
                  className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  title="加入队列"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onInsertNext(track)}
                  className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  title="下一首播放"
                >
                  <ListPlus className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
