"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { PiChatCircleDotsBold, PiHeartBold, PiHeartFill } from "react-icons/pi";
import { PlayerBarStatAction } from "@/components/PlayBar/PlayerBarStatAction";
import { SongQualityBadge } from "@/components/shared/SongQualityBadge";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useSongStatsEnrichment } from "@/hooks/player/useSongStatsEnrichment";
import { getCommentHref } from "@/lib/comment/commentResource";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export interface PlayerBarLeftControlsProps {
  onCloseLyricStage?: () => void;
  isLyricStageBar?: boolean;
}

export function PlayerBarLeftControls({
  onCloseLyricStage,
  isLyricStageBar = false,
}: PlayerBarLeftControlsProps) {
  const { t } = useI18n();
  const isLyricsOpen = useUiStore((s) => s.isLyricsOpen);
  const openLyrics = () => useUiStore.getState().setIsLyricsOpen(true);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);
  const smartRouter = useSmartRouter();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();

  const currentSong = usePlayerStore((s) => s.currentSongDetail);
  const artworkUrl = resolveCoverUrl(currentSong?.al?.picUrl, currentSong?.al?.coverUrl);
  const isLiked = playback.liked;
  const isLyricOpen = useUiStore((s) => s.isLyricsOpen);
  const songStats = useSongStatsEnrichment(currentSong);
  const lyricsActionLabel = t(isLyricsOpen ? "ui.hideLyrics" : "ui.showLyrics");

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 lg:gap-4",
        isLyricStageBar
          ? "justify-start"
          : "flex-1 md:w-fit md:max-w-full md:flex-none md:justify-self-start",
      )}
    >
      {/* 专辑封面 */}
      <div className="group relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md bg-surface-elevated shadow-panel lg:size-14">
        {currentSong && artworkUrl ? (
          <Image
            width={56}
            height={56}
            src={artworkUrl}
            alt={currentSong.al.name}
            className="size-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Skeleton className="size-full" />
        )}
        <div
          onClick={openLyrics}
          className="absolute top-[25%] left-[25%] flex items-center justify-center rounded-full bg-overlay p-1 text-content opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:scale-105"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {isLyricOpen ? (
                  <button
                    type="button"
                    aria-label={lyricsActionLabel}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCloseLyricStage) onCloseLyricStage();
                      else closeLyrics();
                    }}
                  >
                    <ChevronDown className="size-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={lyricsActionLabel}
                    onClick={(e) => {
                      e.stopPropagation();
                      openLyrics();
                    }}
                  >
                    <ChevronUp className="size-5" />
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <ShortcutHint commandId="toggle-lyric-stage" label={lyricsActionLabel} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 歌曲的名字和歌手 */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center overflow-hidden",
          isLyricStageBar
            ? "max-w-[min(26vw,280px)]"
            : "max-w-30 sm:max-w-40 md:w-fit md:flex-none lg:max-w-60",
        )}
      >
        {currentSong ? (
          <>
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (onCloseLyricStage) onCloseLyricStage();
                else closeLyrics();
              }}
              className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-content"
            >
              <span className="cursor-pointer truncate hover:underline">{currentSong.name}</span>
              <SongVipBadge fee={currentSong.fee} />
            </span>
            <div className="mt-0.5 flex min-w-0 items-center gap-1">
              <SongQualityBadge qualityLevel={currentSong?.privilege?.maxBrLevel} />
              <span className="min-w-0 cursor-pointer truncate text-[11px] font-normal text-content-muted">
                {currentSong?.ar?.slice(0, 2).map((a, idx, arr) => (
                  <span
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (useUiStore.getState().isLyricsOpen) onCloseLyricStage?.();
                      smartRouter.push(`/artist?id=${a.id}`);
                    }}
                    title={`/artist?id=${a.id}`}
                    className="hover:text-content hover:underline"
                    style={{ display: "inline" }}
                  >
                    {a.name}
                    {idx < arr.length - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-full bg-skeleton" />
            <div className="h-2.5 w-16 rounded-full bg-skeleton" />
          </div>
        )}
      </div>

      {/* 点赞和评论 */}
      {currentSong && (
        <div
          className={cn(
            "hidden shrink-0 items-center gap-4 sm:flex lg:gap-5",
            isLyricStageBar && "hidden",
          )}
        >
          <PlayerBarStatAction
            count={currentSong.likedCount}
            countClassName={isLiked ? "text-brand" : "text-content-muted"}
            onRetry={() => void songStats.retry()}
            retryLabel={t("common.action.retry")}
            statsStatus={songStats.state.status}
            title={isLiked ? t("common.action.unlike") : t("common.action.like")}
            shortcutCommandId="toggle-like"
            onClick={() => void commands.toggleLike()}
          >
            {isLiked ? (
              <PiHeartFill className="size-5 text-brand lg:size-5.5" />
            ) : (
              <PiHeartBold className="size-5 text-content-muted transition-colors group-hover:text-content lg:size-5.5" />
            )}
          </PlayerBarStatAction>

          <PlayerBarStatAction
            count={currentSong.commentCount}
            countClassName="text-content-muted group-hover:text-content transition-colors"
            href={getCommentHref(
              currentSong.voiceId === undefined ? "song" : "voice",
              currentSong.voiceId ?? currentSong.id,
            )}
            onRetry={() => void songStats.retry()}
            retryLabel={t("common.action.retry")}
            statsStatus={songStats.state.status}
            title={t("contextMenu.comments")}
            shortcutCommandId="open-current-track-comments"
          >
            <PiChatCircleDotsBold className="size-5 text-content-muted transition-colors group-hover:text-content lg:size-5.5" />
          </PlayerBarStatAction>
        </div>
      )}
    </div>
  );
}
