"use client";

import { ListPlus, Pause, Play, Plus } from "lucide-react";
import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import type {
  CommandWorkspaceSearchItem,
  CommandWorkspaceSearchResultListProps,
} from "@/types/commandWorkspace";

export function CommandWorkspaceSearchResultList({
  items,
  onAppend,
  onInsertNext,
  onSelect,
  selectedIndex,
}: CommandWorkspaceSearchResultListProps) {
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  if (items.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-zinc-500">没有找到匹配内容。</p>;
  }

  return (
    <div className="space-y-0.5 px-2.5 py-2">
      {items.slice(0, 40).map((item, index) => {
        const isPlayable =
          item.kind === "song" ||
          (item.kind === "voice" && !!item.entity.mainSong && item.entity.isPlayable !== false);
        const isCurrent =
          !!currentSong &&
          ((item.kind === "song" && item.entity.id === currentSong.id) ||
            (item.kind === "voice" && item.entity.mainSong?.id === currentSong.id));
        const isCurrentPlaying = isCurrent && isPlaying;

        const handleToggleOrSelect = () => {
          if (isCurrent && isPlayable) {
            setIsPlaying(!isPlaying);
          } else {
            onSelect(item);
          }
        };

        return (
          <div
            key={`${item.kind}-${item.entity.id}`}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3.5 py-2 transition-colors",
              isCurrent
                ? "bg-white/10"
                : selectedIndex === index
                  ? "bg-white/10"
                  : "hover:bg-white/6",
            )}
          >
            <button
              type="button"
              onClick={handleToggleOrSelect}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent ? "bg-brand/20 text-brand" : "bg-white/8 text-zinc-300",
                )}
              >
                {isCurrentPlaying ? <PlayingAnimation size={14} /> : getKindLabel(item)}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm font-medium transition-colors hover:underline",
                    isCurrent ? "font-semibold text-brand" : "text-white",
                  )}
                >
                  {getTitle(item)}
                </span>
                <span className="block truncate text-xs text-zinc-400">{getSubtitle(item)}</span>
              </span>
            </button>
            {isPlayable ? (
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onAppend(item)}
                  className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  title="加入队列"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onInsertNext(item)}
                  className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  title="下一首播放"
                >
                  <ListPlus className="size-3.5" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleToggleOrSelect}
              className={cn(
                "shrink-0 rounded p-1.5 transition-colors hover:bg-white/10",
                isCurrent ? "text-brand hover:text-brand" : "text-zinc-400 hover:text-white",
              )}
              title={
                isCurrent ? (isPlaying ? "暂停" : "继续播放") : isPlayable ? "播放" : "查看曲目"
              }
            >
              {isCurrentPlaying ? (
                <Pause className="size-3.5 fill-current" />
              ) : (
                <Play className="size-3.5 fill-current" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function getKindLabel(item: CommandWorkspaceSearchItem) {
  const labels = {
    album: "辑",
    artist: "人",
    playlist: "单",
    podcast: "播",
    song: "歌",
    voice: "节",
  };
  return labels[item.kind];
}

function getTitle(item: CommandWorkspaceSearchItem) {
  return item.entity.name;
}

function getSubtitle(item: CommandWorkspaceSearchItem) {
  switch (item.kind) {
    case "song":
      return `${item.entity.artists.map((artist) => artist.name).join(" / ")} · ${item.entity.album.name}`;
    case "artist":
      return "歌手热门歌曲";
    case "album":
      return item.entity.artist.name;
    case "playlist":
      return item.entity.creator?.nickname ?? "歌单";
    case "podcast":
      return item.entity.hostName ?? "播客";
    case "voice":
      return item.entity.podcastName;
  }
}
