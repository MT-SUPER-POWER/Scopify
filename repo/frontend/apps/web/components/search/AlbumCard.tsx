"use client";

import type { MusicAlbumResult } from "@scopify/music-domain/search";
import { Loader2, Pause, Play } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function AlbumCard({
  album,
  isPlaying,
  isLoading,
  onTogglePlay,
  onClick,
}: {
  album: MusicAlbumResult;
  isPlaying: boolean;
  isLoading?: boolean;
  /** Without it the card has no play button, for platforms that cannot list the album's tracks. */
  onTogglePlay?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "group relative min-w-0 rounded-xl bg-surface-elevated p-4 transition-colors hover:bg-surface-overlay active:bg-surface-sunken",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
    >
      <div className="mb-4 aspect-square w-full overflow-hidden rounded-md bg-surface-sunken shadow-panel">
        <Image
          src={
            album.coverUrl ||
            "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop"
          }
          alt={album.title}
          className="size-full object-cover"
          width={300}
          height={300}
        />
      </div>
      <h4 className="mb-1 truncate text-base font-bold">{album.title}</h4>
      <p className="mt-1 truncate text-sm text-content-muted">
        {album.publishedAt === null ? "" : `${new Date(album.publishedAt).getFullYear()} • `}
        {album.artists[0]?.name || t("common.meta.unknownArtist")}
      </p>

      {onTogglePlay ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay(e);
          }}
          disabled={isLoading}
          className={cn(
            "absolute right-6 bottom-20 z-10 flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-all duration-300 hover:scale-105 hover:bg-brand-hover disabled:opacity-80 disabled:hover:scale-100",
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
      ) : null}
    </div>
  );
}
