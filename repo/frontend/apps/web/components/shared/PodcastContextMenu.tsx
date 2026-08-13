"use client";

import { Heart, Link2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRadioFavorite } from "@/hooks/radio/useRadioFavorite";
import {
  isSubscribedRadio,
  useRadioSubscriptionsQuery,
} from "@/hooks/radio/useRadioSubscriptionsQuery";
import { useI18n } from "@/store/module/i18n";
import type { PodcastContextMenuProps } from "@/types/components/radio";

export function getPodcastContextMenuAction(isActive = false, isPlaying = false) {
  return isActive && isPlaying ? "pause" : "play";
}

export function PodcastContextMenu({
  children,
  isActive,
  isFavorited: knownFavorite,
  isPlaying,
  onPause,
  onPlay,
  podcast,
}: PodcastContextMenuProps) {
  const { t } = useI18n();
  const subscriptionsQuery = useRadioSubscriptionsQuery();
  const isFavorited =
    knownFavorite ?? isSubscribedRadio(subscriptionsQuery.data, String(podcast.id));
  const favorite = useRadioFavorite(isFavorited);
  const isFavoriteStateLoading = knownFavorite === undefined && subscriptionsQuery.isLoading;
  const playbackAction = getPodcastContextMenuAction(isActive, isPlaying);
  const onPlaybackAction = playbackAction === "pause" ? (onPause ?? onPlay) : onPlay;

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(`https://music.163.com/djradio?id=${podcast.id}`)
      .then(() => toast.success(t("playlist.table.copySuccess")))
      .catch(() => toast.error(t("playlist.table.copyFailed")));
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="z-9999 w-48">
        <ContextMenuGroup>
          <ContextMenuItem onClick={onPlaybackAction}>
            {playbackAction === "pause" ? (
              <>
                <Pause className="mr-2 size-4 fill-current" />
                {t("contextMenu.pause")}
              </>
            ) : (
              <>
                <Play className="mr-2 size-4 fill-current" />
                {t("contextMenu.play")}
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={isFavoriteStateLoading || favorite.isFavoriting}
            onClick={() => void favorite.toggleFavorite(podcast.id)}
          >
            <Heart className="mr-2 size-4" fill={favorite.isFavorited ? "currentColor" : "none"} />
            {favorite.isFavorited
              ? t("library.podcasts.action.unfavorite")
              : t("library.podcasts.action.favorite")}
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyLink}>
          <Link2 className="mr-2 size-4" />
          {t("contextMenu.copyLink")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
