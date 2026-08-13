"use client";

import { Loader2, Pause, Play } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { Playlist } from "@/types/search";

/** 格式化播放量 (例如 123456 -> 123.5K) */
function formatCount(count: number): string {
  if (!count) return "0";
  if (count > 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
  if (count > 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count > 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function PlaylistCard({
  playlist,
  isPlaying,
  isLoading,
  onTogglePlay,
  onClick,
}: {
  playlist: Playlist;
  isPlaying: boolean;
  isLoading?: boolean;
  onTogglePlay: (e: React.MouseEvent) => void;
  onClick?: () => void;
}) {
  const { t } = useI18n();

  return (
    <div
      className="bg-surface-elevated hover:bg-surface-overlay active:bg-surface-sunken group relative min-w-0 cursor-pointer rounded-xl p-4 transition-colors"
      onClick={onClick}
    >
      <div className="bg-surface-sunken shadow-panel relative mb-4 aspect-square w-full overflow-hidden rounded-md">
        <img src={playlist.coverImgUrl} alt={playlist.name} className="size-full object-cover" />
        {playlist.playCount > 0 && (
          <div className="bg-overlay/75 text-overlay-foreground absolute top-1 right-2 rounded px-2 py-0.5 text-[11px] font-bold">
            ▷ {formatCount(playlist.playCount)}
          </div>
        )}
      </div>
      <h4 className="mb-1 truncate text-base font-bold">{playlist.name}</h4>
      <p className="text-content-muted mt-1 truncate text-sm">
        {t("search.playlist.byCreator", {
          name: playlist.creator?.nickname || t("search.playlist.neteaseUser"),
        })}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay(e);
        }}
        disabled={isLoading}
        className={cn(
          "bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover absolute right-6 bottom-20 z-10 flex size-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-80 disabled:hover:scale-100",
          isPlaying || isLoading
            ? "translate-y-0 opacity-100"
            : "translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
        )}
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="size-6 fill-current" />
        ) : (
          <Play className="ml-1 size-6 fill-current" />
        )}
      </button>
    </div>
  );
}
