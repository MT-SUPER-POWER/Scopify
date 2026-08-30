"use client";

import { ListPlus, Play, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDuration } from "@/lib/utils";
import type { SongDetail } from "@/types/api/music";
import type { CommandWorkspaceTrackList as CommandWorkspaceTrackListModel } from "@/types/commandWorkspace";

interface CommandWorkspaceTrackListProps {
  onAppend(track: SongDetail): void;
  onInsertNext(track: SongDetail): void;
  onPlay(index: number): void;
  trackList: CommandWorkspaceTrackListModel;
}

export function CommandWorkspaceTrackList({
  onAppend,
  onInsertNext,
  onPlay,
  trackList,
}: CommandWorkspaceTrackListProps) {
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
        {trackList.tracks.map((track, index) => (
          <div
            key={`${track.voiceId ?? "song"}-${track.id}-${index}`}
            className="group flex items-center gap-3 rounded-lg px-3.5 py-2 transition-colors hover:bg-white/6"
          >
            <span className="w-5 text-right text-xs text-zinc-500 tabular-nums">{index + 1}</span>
            <button
              type="button"
              onClick={() => onPlay(index)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-medium text-white">{track.name}</span>
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
        ))}
      </div>
    </ScrollArea>
  );
}
