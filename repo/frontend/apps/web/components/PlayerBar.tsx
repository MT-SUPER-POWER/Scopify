"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { PlayerProgressBar } from "@components/PlayBar/ProgressBar";
import {
  ChevronDown,
  ChevronUp,
  Expand,
  LoaderCircle,
  Mic2,
  MinimizeIcon,
  MonitorSpeaker,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { PiChatCircleDotsBold, PiHeartBold, PiHeartFill } from "react-icons/pi"; // 引入更圆润的 Phosphor Icons 图标
import { DesktopPlaybackControllerLauncher } from "@/components/desktopWallpaper/DesktopPlaybackControllerLauncher";
import { AudioSettingsDialog } from "@/components/player/AudioSettingsDialog";
import { QueuePopover } from "@/components/player/QueuePopover";
import { SongQualityBadge } from "@/components/shared/SongQualityBadge";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";

import { VolumeControl } from "@/components/VolumeControl";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useSongStatsEnrichment } from "@/hooks/player/useSongStatsEnrichment";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { getCommentHref } from "@/lib/comment/commentResource";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { cn, formatCompactCount } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { PlayerBarStatActionProps } from "@/types/components/player";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 图标右上角数字（PlayerBar 专用） */
// BUG: hover 时，数字会被下面的 ICON 盖住（好像是因为毛玻璃的 BUG 导致的计算渲染问题）
function PlayerBarStatAction({
  count,
  countClassName,
  onClick,
  onRetry,
  href,
  retryLabel,
  shortcutCommandId,
  statsStatus = "idle",
  title,
  children,
}: PlayerBarStatActionProps) {
  const isLoading = count === undefined && statsStatus === "loading";
  const isUnavailable =
    count === undefined && (statsStatus === "failed" || statsStatus === "partial");
  const body = (
    <div className="relative inline-flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
      {/* 修复点 1：把 children（图标）显式包裹并设为 z-0，强制将其压在底层 */}
      <div className="relative z-0 flex items-center justify-center">{children}</div>

      {count != null && count > 0 ? (
        <span
          className={cn(
            // 修复点 2：将无效的 z-80 改为标准的 z-10
            "absolute top-0 right-0 z-10 translate-x-[63%] -translate-y-1/3",
            // 修复点 3：加上 transform-gpu 开启 3D 硬件加速，彻底解决 scale 动画和毛玻璃冲突的 Bug
            "transform-gpu",
            "flex min-w-4 items-center justify-center rounded-full border border-border bg-surface-overlay/80 px-1 py-px text-content shadow-sm backdrop-blur-md",
            "pointer-events-none text-[9px] leading-none font-bold whitespace-nowrap tabular-nums",
            countClassName,
          )}
        >
          {formatCompactCount(count)}
        </span>
      ) : isLoading ? (
        <LoaderCircle
          aria-label={title}
          className="absolute top-0 right-0 size-3.5 translate-x-[42%] translate-y-[-42%] animate-spin text-content-muted"
        />
      ) : null}
    </div>
  );

  const className = "shrink-0 py-1 pr-2 cursor-pointer hover:opacity-90 transition-opacity";

  const action = href ? (
    <Link href={href} aria-label={title} onClick={onClick} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" aria-label={title} onClick={onClick} className={className}>
      {body}
    </button>
  );

  const retryAction =
    isUnavailable && onRetry ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={retryLabel}
            className="absolute top-0 right-1 z-20 flex size-3.5 translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full border border-border bg-surface text-content-muted transition-colors hover:text-content"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRetry();
            }}
          >
            <RotateCw className="size-2.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {retryLabel}
        </TooltipContent>
      </Tooltip>
    ) : null;

  if (!title)
    return (
      <div className="group relative shrink-0">
        {action}
        {retryAction}
      </div>
    );

  return (
    <TooltipProvider>
      <div className="group relative shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>{action}</TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <ShortcutHint commandId={shortcutCommandId} label={title} />
          </TooltipContent>
        </Tooltip>
        {retryAction}
      </div>
    </TooltipProvider>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PlayerBar = ({
  className,
  onCloseLyricStage,
  style,
  bgClass,
  variant = "default",
}: {
  className?: string;
  onCloseLyricStage?: () => void;
  style?: React.CSSProperties;
  bgClass?: string;
  variant?: "default" | "lyric-stage";
}) => {
  const { t } = useI18n();
  const isLyricsOpen = useUiStore((s) => s.isLyricsOpen);
  const toggleLyrics = useUiStore((s) => s.toggleLyrics);
  const isFullscreen = useUiStore((s) => s.isFullscreen);
  const openLyrics = () => useUiStore.getState().setIsLyricsOpen(true);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);
  const smartRouter = useSmartRouter();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();

  // Zustand Stores
  const currentSong = usePlayerStore((s) => s.currentSongDetail);
  const artworkUrl = resolveCoverUrl(currentSong?.al?.picUrl, currentSong?.al?.coverUrl);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const isLiked = playback.liked;
  const isPlaying = playback.isPlaying;
  const volume = playback.volume;
  const isLyricOpen = useUiStore((s) => s.isLyricsOpen);
  const isLyricStageBar = variant === "lyric-stage";
  const { musicQuality } = useMusicQuality();
  const songStats = useSongStatsEnrichment(currentSong);

  // 查找当前选中的音质选项，如果找不到就提供一个兜底
  const currentOption = QUALITY_OPTIONS.find((opt) => opt.value === musicQuality);
  const CurrentIcon = currentOption?.icon ?? Radio;

  // 切换播放模式
  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };
  const shuffleModeLabel = t(isShuffle ? "ui.shuffleOn" : "ui.shuffleOff");
  const repeatModeLabel = t(
    repeatMode === "one" ? "ui.repeatOne" : repeatMode === "all" ? "ui.repeatAll" : "ui.repeatOff",
  );
  const playbackActionLabel = t(isPlaying ? "ui.pause" : "ui.play");
  const lyricsActionLabel = t(isLyricsOpen ? "ui.hideLyrics" : "ui.showLyrics");
  const fullscreenActionLabel = t(isFullscreen ? "ui.exitFullscreen" : "ui.fullscreen");

  return (
    <div
      className={cn(
        "z-20 flex h-17 w-full items-center justify-between transition-all duration-300 ease-linear lg:h-20",
        bgClass ?? "bg-surface",
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          "z-20 h-17 w-full items-center px-4 transition-all duration-300 ease-linear lg:h-20",
          isLyricStageBar
            ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4"
            : "flex justify-between md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4",
        )}
      >
        {/* ================= Left: Song Info ================= */}
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
                  <span className="cursor-pointer truncate hover:underline">
                    {currentSong.name}
                  </span>
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

        {/* ================= Center: Controls ================= */}
        <div
          className={cn(
            "flex min-w-0 flex-col items-center justify-center gap-1.5",
            isLyricStageBar
              ? "w-[clamp(280px,40vw,560px)]"
              : "flex-2 md:w-[clamp(280px,40vw,560px)] md:flex-none",
          )}
        >
          <TooltipProvider>
            <div className="mt-1 flex items-center gap-4 lg:gap-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={shuffleModeLabel}
                    onClick={toggleShuffle}
                    className={cn(
                      "relative hidden transition-colors sm:block",
                      isShuffle ? "text-brand" : "text-content-muted hover:text-content",
                      "after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-brand after:content-['']",
                      isShuffle ? "after:opacity-100" : "after:opacity-0",
                    )}
                  >
                    <Shuffle className="size-4 lg:size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {shuffleModeLabel}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("ui.previous")}
                    onClick={() => void commands.previous()}
                    className="text-content-muted transition-colors hover:text-content"
                  >
                    <SkipBack className="size-4 fill-current lg:size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  <ShortcutHint commandId="previous-track" label={t("ui.previous")} />
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={playbackActionLabel}
                    onClick={() => void commands.toggle()}
                    disabled={!playback.canControl}
                    className="flex size-9 items-center justify-center rounded-full bg-content text-surface transition-all hover:scale-105 hover:bg-content/90 active:scale-95 disabled:opacity-40 lg:size-10"
                  >
                    {isPlaying ? (
                      <Pause className="size-4 fill-current lg:size-5" />
                    ) : (
                      <Play className="size-4 fill-current lg:size-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  <ShortcutHint commandId="toggle-playback" label={playbackActionLabel} />
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("ui.next")}
                    onClick={() => void commands.next()}
                    className="text-content-muted transition-colors hover:text-content"
                  >
                    <SkipForward className="size-4 fill-current lg:size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  <ShortcutHint commandId="next-track" label={t("ui.next")} />
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={repeatModeLabel}
                    onClick={cycleRepeat}
                    className={cn(
                      "relative hidden transition-colors sm:block",
                      repeatMode !== "off" ? "text-brand" : "text-content-muted hover:text-content",
                      "after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-brand after:content-['']",
                      repeatMode !== "off" ? "after:opacity-100" : "after:opacity-0",
                    )}
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="size-4 lg:size-5" />
                    ) : (
                      <Repeat className="size-4 lg:size-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {repeatModeLabel}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="hidden h-4 w-full sm:flex">
            <PlayerProgressBar />
          </div>
        </div>

        {/* ================= Right: Extra Controls ================= */}
        <div
          className={cn(
            "flex items-center justify-end gap-2 text-content-muted lg:gap-3",
            isLyricStageBar ? "min-w-0" : "flex-1 md:flex-none md:justify-self-end",
          )}
        >
          <DesktopPlaybackControllerLauncher />

          {/* Lyric Stage */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toggleLyrics()}
                  aria-label={lyricsActionLabel}
                  className={`transition-colors hover:text-content ${isLyricsOpen ? "text-brand" : ""}`}
                >
                  <Mic2 className="size-4 lg:size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <ShortcutHint commandId="toggle-lyric-stage" label={lyricsActionLabel} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 音频设置 */}
          <TooltipProvider>
            <Tooltip>
              <AudioSettingsDialog>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("audioSettings.open")}
                    className="flex cursor-pointer items-center justify-center transition-colors hover:text-content"
                  >
                    <CurrentIcon className="size-4 lg:size-5" />
                  </button>
                </TooltipTrigger>
              </AudioSettingsDialog>
              <TooltipContent side="top" sideOffset={8}>
                {t("audioSettings.title")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 播放列表浮层 */}
          <div className="hidden md:block">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="z-2000"
                style={{ position: "relative" }}
              >
                <QueuePopover />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* TODO: 蓝牙 */}
          <div className="hidden lg:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("ui.bluetooth")}
                    className="flex items-center justify-center transition-colors hover:text-content"
                  >
                    <MonitorSpeaker className="size-4 lg:size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {t("ui.bluetooth")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 音量控制 */}
          <VolumeControl
            initialVolume={volume}
            onChange={(nextVolume) => void commands.setVolume(nextVolume)}
          />

          {/* 最大化/最小化按钮 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={fullscreenActionLabel}
                  onClick={() => void toggleApplicationFullscreen()}
                  className="hidden transition-colors hover:text-content sm:block"
                >
                  {isFullscreen ? (
                    <MinimizeIcon className="size-4 lg:size-5" />
                  ) : (
                    <Expand className="size-4 lg:size-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <ShortcutHint commandId="toggle-fullscreen" label={fullscreenActionLabel} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
