"use client";

import { FileText, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { LikedVoiceMetadata } from "@/components/voice/LikedVoiceMetadata";
import { VoiceTranscriptPopover } from "@/components/voice/VoiceTranscriptPopover";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VoiceItemProps } from "@/types/components/search";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=160&auto=format&fit=crop";

export function VoiceItem({
  enableContextMenu = false,
  index,
  onViewTranscript,
  transcriptMode = "dialog",
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
  const isLikedVoice = variant === "liked";
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const isUnavailable = voice.isPlayable === false;
  const isActive =
    !isUnavailable && !!voice.mainSong && voice.mainSong.id === currentSongDetail?.id;

  const handlePlay = useCallback(() => {
    if (!voice.mainSong || isUnavailable) return;

    if (isActive) {
      setIsPlaying(!isPlaying);
      return;
    }

    const queue = voices.flatMap((item) =>
      item.mainSong && item.isPlayable !== false
        ? [toVoiceSongDetail(item.mainSong, item.coverUrl, item.id)]
        : [],
    );
    const queueIndex = voices
      .slice(0, index)
      .filter((item) => item.mainSong && item.isPlayable !== false).length;
    setQueue(queue, queueIndex);
    void playTrack(toVoiceSongDetail(voice.mainSong, voice.coverUrl, voice.id));
  }, [
    index,
    isActive,
    isPlaying,
    isUnavailable,
    playTrack,
    setIsPlaying,
    setQueue,
    voice.coverUrl,
    voice.id,
    voice.mainSong,
    voices,
  ]);

  const canViewTranscript = transcriptMode === "popover" || Boolean(onViewTranscript);
  const handleViewTranscript = useCallback(() => {
    if (transcriptMode === "popover") {
      setIsTranscriptOpen(true);
      return;
    }
    onViewTranscript?.(voice);
  }, [onViewTranscript, transcriptMode, voice]);

  const playLabel = isActive && isPlaying ? t("contextMenu.pause") : t("contextMenu.play");
  const isPreview = variant === "preview";

  const item = (
    <div
      className={cn(
        "group flex min-w-0 items-center rounded-md transition-colors",
        isPreview ? "gap-3 p-1" : isLikedVoice ? "items-start gap-3 p-3" : "gap-3 px-3 py-2",
        isUnavailable
          ? "cursor-not-allowed bg-content/15 opacity-45 grayscale"
          : voice.mainSong
            ? "cursor-pointer hover:bg-content/10"
            : "cursor-default opacity-70",
        isActive && "text-brand",
      )}
      onClick={handlePlay}
    >
      {!isPreview && (
        <div className="flex w-6 shrink-0 justify-center text-sm text-content-muted">
          {index + 1}
        </div>
      )}
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded bg-surface-elevated",
          isPreview ? "size-16" : "size-11",
        )}
      >
        <Image
          width={isPreview ? 64 : 44}
          height={isPreview ? 64 : 44}
          src={voice.coverUrl || FALLBACK_COVER}
          alt={voice.name}
          className={cn("size-full object-cover", isUnavailable && "brightness-50")}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p
            className={cn(
              "truncate font-medium",
              isPreview ? "text-base" : "text-sm",
              isActive ? "text-brand" : "text-content",
            )}
          >
            {voice.name}
          </p>
          {isLikedVoice && isUnavailable ? (
            <span className="shrink-0 rounded-full bg-content/10 px-2 py-0.5 text-[10px] font-medium text-content-muted">
              {t("library.voice.status.unavailable")}
            </span>
          ) : null}
        </div>
        <p className={cn("truncate text-xs text-content-muted", isPreview && "mt-1")}>
          {isPreview && voice.duration > 0 && `${formatDuration(voice.duration)} · `}
          {voice.podcastName}
          {voice.hostName ? ` · ${voice.hostName}` : ""}
        </p>
        {isLikedVoice ? <LikedVoiceMetadata voice={voice} /> : null}
      </div>
      {!isPreview && (
        <span className="w-12 shrink-0 text-right text-sm text-content-muted">
          {formatDuration(voice.duration)}
        </span>
      )}
      {(canViewTranscript || (voice.mainSong && !isUnavailable)) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {canViewTranscript && (
            <button
              type="button"
              title={t("search.voice.transcript")}
              aria-label={t("search.voice.transcript")}
              onClick={(event) => {
                event.stopPropagation();
                handleViewTranscript();
              }}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-content/10 text-content opacity-0 transition-all group-hover:opacity-100 hover:scale-105 hover:bg-content/20 focus:opacity-100",
                isPreview ? "size-10" : "size-9",
              )}
            >
              <FileText className="size-4" />
            </button>
          )}
          {voice.mainSong && !isUnavailable && (
            <button
              type="button"
              title={playLabel}
              aria-label={playLabel}
              onClick={(event) => {
                event.stopPropagation();
                handlePlay();
              }}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-content/10 text-content opacity-0 transition-all group-hover:opacity-100 hover:scale-105 hover:bg-brand hover:text-brand-foreground focus:opacity-100",
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

  const contextItem =
    !enableContextMenu || !voice.mainSong || isUnavailable ? (
      item
    ) : (
      <SongContextMenu
        isActive={isActive}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onViewTranscript={canViewTranscript ? handleViewTranscript : undefined}
        song={toVoiceSongDetail(voice.mainSong, voice.coverUrl, voice.id)}
      >
        {item}
      </SongContextMenu>
    );

  if (transcriptMode !== "popover") return contextItem;

  return (
    <VoiceTranscriptPopover
      open={isTranscriptOpen}
      onOpenChange={setIsTranscriptOpen}
      voice={voice}
    >
      {contextItem}
    </VoiceTranscriptPopover>
  );
}
