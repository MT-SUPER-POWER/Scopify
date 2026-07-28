"use client";

import { FileText, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { VoiceItemProps } from "@/types/components/search";
import type { Song } from "@/types/search";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=160&auto=format&fit=crop";

function toSongDetail(song: Song): SongDetail {
  return {
    al: {
      id: song.album.id,
      name: song.album.name,
      picUrl: song.album.picUrl || song.artists[0]?.picUrl || "",
    },
    ar: song.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    dt: song.duration,
    fee: song.fee ?? 0,
    id: song.id,
    name: song.name,
    publishTime: song.album.publishTime,
  };
}

export function VoiceItem({
  index,
  onViewTranscript,
  variant = "default",
  voice,
  voices,
}: VoiceItemProps) {
  const { t } = useI18n();
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const isActive = !!voice.mainSong && voice.mainSong.id === currentSongDetail?.id;

  const handlePlay = useCallback(() => {
    if (!voice.mainSong) return;

    if (isActive) {
      setIsPlaying(!isPlaying);
      return;
    }

    const queue = voices.flatMap((item) => (item.mainSong ? [toSongDetail(item.mainSong)] : []));
    const queueIndex = voices.slice(0, index).filter((item) => item.mainSong).length;
    setQueue(queue, queueIndex);
    void playTrack(toSongDetail(voice.mainSong));
  }, [index, isActive, isPlaying, playTrack, setIsPlaying, setQueue, voice.mainSong, voices]);

  const playLabel = isActive && isPlaying ? t("contextMenu.pause") : t("contextMenu.play");
  const isPreview = variant === "preview";

  return (
    <div
      className={cn(
        "group flex min-w-0 items-center rounded-md transition-colors",
        isPreview ? "gap-3 p-1" : "gap-3 px-3 py-2",
        voice.mainSong ? "cursor-pointer hover:bg-white/10" : "cursor-default opacity-70",
        isActive && "text-[#1ed760]",
      )}
      onClick={handlePlay}
    >
      {!isPreview && (
        <div className="flex w-6 shrink-0 justify-center text-sm text-zinc-400">{index + 1}</div>
      )}
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded bg-zinc-800",
          isPreview ? "size-16" : "size-11",
        )}
      >
        <Image
          width={isPreview ? 64 : 44}
          height={isPreview ? 64 : 44}
          src={voice.coverUrl || FALLBACK_COVER}
          alt={voice.name}
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium",
            isPreview ? "text-base" : "text-sm",
            isActive ? "text-[#1ed760]" : "text-white",
          )}
        >
          {voice.name}
        </p>
        <p className={cn("truncate text-xs text-zinc-400", isPreview && "mt-1")}>
          {isPreview && voice.duration > 0 && `${formatDuration(voice.duration)} · `}
          {voice.podcastName}
          {voice.hostName ? ` · ${voice.hostName}` : ""}
        </p>
      </div>
      {!isPreview && (
        <span className="w-12 shrink-0 text-right text-sm text-zinc-400">
          {formatDuration(voice.duration)}
        </span>
      )}
      {(onViewTranscript || voice.mainSong) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {onViewTranscript && (
            <button
              type="button"
              title={t("search.voice.transcript")}
              aria-label={t("search.voice.transcript")}
              onClick={(event) => {
                event.stopPropagation();
                onViewTranscript(voice);
              }}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-white/10 text-white opacity-0 transition-all group-hover:opacity-100 hover:scale-105 hover:bg-white/20 focus:opacity-100",
                isPreview ? "size-10" : "size-9",
              )}
            >
              <FileText className="size-4" />
            </button>
          )}
          {voice.mainSong && (
            <button
              type="button"
              title={playLabel}
              aria-label={playLabel}
              onClick={(event) => {
                event.stopPropagation();
                handlePlay();
              }}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-white/10 text-white opacity-0 transition-all group-hover:opacity-100 hover:scale-105 hover:bg-[#1ed760] hover:text-black focus:opacity-100",
                isPreview ? "size-10" : "size-9",
              )}
            >
              {isActive && isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="ml-0.5 size-4 fill-current" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
