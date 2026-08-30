"use client";

import { ListPlus, Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceSearchItem } from "@/types/commandWorkspace";

interface CommandWorkspaceSearchResultListProps {
  items: CommandWorkspaceSearchItem[];
  onAppend(item: CommandWorkspaceSearchItem): void;
  onInsertNext(item: CommandWorkspaceSearchItem): void;
  onSelect(item: CommandWorkspaceSearchItem): void;
  selectedIndex: number;
}

export function CommandWorkspaceSearchResultList({
  items,
  onAppend,
  onInsertNext,
  onSelect,
  selectedIndex,
}: CommandWorkspaceSearchResultListProps) {
  if (items.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-zinc-500">没有找到匹配内容。</p>;
  }

  return (
    <div className="space-y-0.5 px-2.5 py-2">
      {items.slice(0, 40).map((item, index) => {
        const isPlayable =
          item.kind === "song" ||
          (item.kind === "voice" && !!item.entity.mainSong && item.entity.isPlayable !== false);
        return (
          <div
            key={`${item.kind}-${item.entity.id}`}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3.5 py-2 transition-colors",
              selectedIndex === index ? "bg-white/10" : "hover:bg-white/6",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-zinc-300">
                {getKindLabel(item)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">
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
              onClick={() => onSelect(item)}
              className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              title={isPlayable ? "播放" : "查看曲目"}
            >
              <Play className="size-3.5" />
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
