"use client";

import { ArrowDownCircle, MoreHorizontal, Pause, Play, Shuffle } from "lucide-react";
import { CollectionToggleButton } from "@/components/shared/CollectionToggleButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/store/module/i18n";

interface AlbumActionsProps {
  isPlaying: boolean;
  isAlbumCollected: boolean;
  isTogglingAlbumSubscribe: boolean;
  onPlay: () => void;
  onToggleSubscribe: () => void;
}

export function AlbumActions({
  isPlaying,
  isAlbumCollected,
  isTogglingAlbumSubscribe,
  onPlay,
  onToggleSubscribe,
}: AlbumActionsProps) {
  const { t } = useI18n();
  const playLabel = t(isPlaying ? "ui.pause" : "ui.play");

  return (
    <TooltipProvider>
      <div className="flex items-center gap-6 p-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={playLabel}
              onClick={onPlay}
              className="flex size-14 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-lg transition-all hover:scale-105 hover:bg-[#3be477] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              {isPlaying ? (
                <Pause className="ml-0.5 size-6 fill-current" />
              ) : (
                <Play className="ml-1.5 size-6 fill-current" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {playLabel}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.shuffle")}
              className="flex size-8 items-center justify-center text-zinc-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              <Shuffle className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.shuffle")}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.download")}
              className="flex size-8 items-center justify-center text-zinc-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              <ArrowDownCircle className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.download")}
          </TooltipContent>
        </Tooltip>

        <CollectionToggleButton
          isCollected={isAlbumCollected}
          isLoading={isTogglingAlbumSubscribe}
          onToggle={onToggleSubscribe}
          subscribeLabel={t("album.action.subscribe")}
          unsubscribeLabel={t("album.action.unsubscribe")}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.more")}
              className="flex size-8 items-center justify-center text-zinc-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              <MoreHorizontal className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.more")}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
