"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { useSimilarSongPlayback } from "@/hooks/song/useSimilarSongPlayback";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import type { NowPlayingSimilarRowProps } from "@/types/player/nowPlayingComponents";

/** 相似歌曲中的一行：点击播放（与相似歌曲弹窗一致），右键可加入歌单或队列。 */
export function NowPlayingSimilarRow({ song, songs }: NowPlayingSimilarRowProps) {
  const { isActive, isPlaying, play } = useSimilarSongPlayback(song, songs);

  return (
    <SongContextMenu song={song} isActive={isActive} isPlaying={isPlaying} onPlay={play}>
      <button
        type="button"
        onClick={play}
        className="group mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-content/5"
      >
        <span className="relative size-10 shrink-0 overflow-hidden rounded bg-surface-elevated">
          {song.al?.picUrl && (
            <Image
              fill
              sizes="40px"
              src={getSizedImageUrl(song.al.picUrl, 100)}
              alt=""
              className="object-cover transition-opacity group-hover:opacity-40"
            />
          )}
          {isActive && isPlaying ? (
            <Pause className="absolute inset-0 m-auto size-4 fill-current text-content opacity-0 transition-opacity group-hover:opacity-100" />
          ) : (
            <Play className="absolute inset-0 m-auto size-4 fill-current text-content opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              isActive ? "text-brand" : "text-content",
            )}
          >
            {song.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-content-muted">
            {song.ar?.map((artist) => artist.name).join(", ")}
          </span>
        </span>
      </button>
    </SongContextMenu>
  );
}
