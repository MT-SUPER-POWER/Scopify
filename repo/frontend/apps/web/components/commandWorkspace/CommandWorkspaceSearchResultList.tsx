"use client";

import { ListPlus, Pause, Play, Plus } from "lucide-react";
import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import {
  getCommandSearchKindLabel,
  getCommandSearchTitle,
  getCommandSearchSubtitle,
} from "@/lib/commandWorkspace/searchItemLabels";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import type { CommandWorkspaceSearchResultListProps } from "@/types/commandWorkspace/model";

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
    return <p className="px-5 py-10 text-center text-sm text-content-muted">没有找到匹配内容。</p>;
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
                ? "bg-content/10"
                : selectedIndex === index
                  ? "bg-content/10"
                  : "hover:bg-content/6",
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
                  isCurrent ? "bg-brand/20 text-brand" : "bg-content/8 text-content-muted",
                )}
              >
                {isCurrentPlaying ? (
                  <PlayingAnimation size={14} />
                ) : (
                  getCommandSearchKindLabel(item)
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm font-medium transition-colors hover:underline",
                    isCurrent ? "font-semibold text-brand" : "text-content",
                  )}
                >
                  {getCommandSearchTitle(item)}
                </span>
                <span className="block truncate text-xs text-content-muted">
                  {getCommandSearchSubtitle(item)}
                </span>
              </span>
            </button>
            {isPlayable ? (
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onAppend(item)}
                  className="rounded p-1.5 text-content-muted hover:bg-content/10 hover:text-content"
                  title="加入队列"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onInsertNext(item)}
                  className="rounded p-1.5 text-content-muted hover:bg-content/10 hover:text-content"
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
                "shrink-0 rounded p-1.5 transition-colors hover:bg-content/10",
                isCurrent ? "text-brand hover:text-brand" : "text-content-muted hover:text-content",
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
