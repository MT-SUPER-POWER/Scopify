"use client";

import { ArrowDownCircle, MoreHorizontal, Pause, Play, Shuffle } from "lucide-react";

import { PlaylistViewButton } from "@/components/Playlist/lattice/PlaylistViewButton";
import { CapabilityGate } from "@/components/provider/CapabilityGate";
import { CollectionToggleButton } from "@/components/shared/CollectionToggleButton";
import { TrackPreviewButton } from "@/components/trackPreview/TrackPreviewButton";
import { useTranslation } from "react-i18next";

import type { AlbumActionsProps } from "@/types/album/model";
import { AlbumCommentButton } from "./AlbumCommentButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export function AlbumActions({
  albumId,
  albumTitle,
  previewSongs,
  isPlaying,
  isAlbumCollected,
  isTogglingAlbumSubscribe,
  onPlay,
  onOpenLattice,
  onToggleSubscribe,
}: AlbumActionsProps) {
  const { t } = useTranslation();
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
              className="flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-all hover:scale-105 hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
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

        <TrackPreviewButton tracks={previewSongs} title={albumTitle} playlistId={albumId} />

        <CapabilityGate requires="comments.read">
          <AlbumCommentButton albumId={albumId} />
        </CapabilityGate>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.shuffle")}
              className="flex size-8 items-center justify-center text-content-muted transition-colors hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
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
              className="flex size-8 items-center justify-center text-content-muted transition-colors hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
            >
              <ArrowDownCircle className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.download")}
          </TooltipContent>
        </Tooltip>

        <CapabilityGate requires="album.subscribe">
          <CollectionToggleButton
            isCollected={isAlbumCollected}
            isLoading={isTogglingAlbumSubscribe}
            onToggle={onToggleSubscribe}
            subscribeLabel={t("album.action.subscribe")}
            unsubscribeLabel={t("album.action.unsubscribe")}
          />
        </CapabilityGate>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("album.action.more")}
              className="flex size-8 items-center justify-center text-content-muted transition-colors hover:text-content focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
            >
              <MoreHorizontal className="size-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("album.action.more")}
          </TooltipContent>
        </Tooltip>
        <div className="ml-auto">
          {onOpenLattice && <PlaylistViewButton onOpen={onOpenLattice} />}
        </div>
      </div>
    </TooltipProvider>
  );
}
