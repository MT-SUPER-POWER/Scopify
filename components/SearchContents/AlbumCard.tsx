"use client";

import { Loader2, Pause, Play } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { Album } from "@/types/search";

export function AlbumCard({
  album,
  isPlaying,
  isLoading,
  onTogglePlay,
  onClick,
}: {
  album: Album;
  isPlaying: boolean;
  isLoading?: boolean;
  onTogglePlay: (e: React.MouseEvent) => void;
  onClick?: () => void;
}) {
  const { t } = useI18n();

  return (
    <div
      className="group relative cursor-pointer rounded-xl bg-[#181818] p-4 transition-colors hover:bg-[#282828] active:bg-[#202020]"
      onClick={onClick}
    >
      <div className="mb-4 aspect-square w-full overflow-hidden rounded-md bg-zinc-800 shadow-lg">
        <Image
          src={
            album.picUrl ||
            "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop"
          }
          alt={album.name}
          className="size-full object-cover"
          width={300}
          height={300}
        />
      </div>
      <h4 className="mb-1 truncate text-base font-bold">{album.name}</h4>
      <p className="mt-1 truncate text-sm text-zinc-400">
        {new Date(album.publishTime).getFullYear()} •{" "}
        {album.artist?.name || t("common.meta.unknownArtist")}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay(e);
        }}
        disabled={isLoading}
        className={cn(
          "absolute right-6 bottom-20 z-10 flex size-12 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 hover:bg-[#3be477] disabled:opacity-80 disabled:hover:scale-100",
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
