"use client";
import { Music2, Pause, Play } from "lucide-react";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SongQualityBadge } from "@/components/shared/SongQualityBadge";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { useSimilarSongPlayback } from "@/hooks/song/useSimilarSongPlayback";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SimilarSongRowProps } from "@/types/components/similarSongs";

export function SimilarSongRow({ song, songs }: SimilarSongRowProps) {
  const { t } = useI18n();
  const { isActive, isPlaying, play } = useSimilarSongPlayback(song, songs);
  const duration = Math.floor(song.dt / 1000);
  return (
    <SongContextMenu song={song} isActive={isActive} isPlaying={isPlaying} onPlay={play}>
      <div
        tabIndex={0}
        onDoubleClick={play}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "bg-primary/10",
        )}
      >
        <button
          type="button"
          onClick={play}
          onDoubleClick={(event) => event.stopPropagation()}
          aria-label={`${t(isActive && isPlaying ? "contextMenu.pause" : "contextMenu.play")} ${song.name}`}
          className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
        >
          {song.al.picUrl ? (
            <img src={song.al.picUrl} alt="" className="size-full object-cover" />
          ) : (
            <Music2 className="size-5" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
            {isActive && isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              title={song.name}
              className={cn("truncate text-sm font-semibold", isActive && "text-primary")}
            >
              {song.name}
            </span>
            <SongVipBadge fee={song.fee} />
            <SongQualityBadge qualityLevel={song.privilege?.maxBrLevel} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {song.ar.map((artist) => artist.name).join(" / ")} · {song.al.name}
          </p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
        </span>
      </div>
    </SongContextMenu>
  );
}
