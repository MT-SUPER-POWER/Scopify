"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { PlayerProgressBar } from "@components/PlayBar/ProgressBar";
import {
  ChevronDown,
  ChevronUp,
  Expand,
  Mic2,
  MinimizeIcon,
  MonitorSpeaker,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { PiChatCircleDotsBold, PiHeartBold, PiHeartFill } from "react-icons/pi"; // 引入更圆润的 Phosphor Icons 图标
import { toast } from "sonner";
import { DesktopPlaybackControllerLauncher } from "@/components/desktopWallpaper/DesktopPlaybackControllerLauncher";
import { QueuePopover } from "@/components/QueuePopover";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { VolumeControl } from "@/components/VolumeControl";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { enrichSongStatsById } from "@/lib/song/enrichSongStats";
import { cn, formatCompactCount } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useUiStore } from "@/store/module/ui";
import type { PlayerBarStatActionProps } from "@/types/components/player";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 图标右上角数字（PlayerBar 专用） */
// BUG: hover 时，数字会被下面的 ICON 盖住（好像是因为毛玻璃的 BUG 导致的计算渲染问题）
function PlayerBarStatAction({
  count,
  countClassName,
  onClick,
  href,
  title,
  children,
}: PlayerBarStatActionProps) {
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
            "bg-surface-overlay/80 border-border text-content flex min-w-4 items-center justify-center rounded-full border px-1 py-px shadow-sm backdrop-blur-md",
            "pointer-events-none text-[9px] leading-none font-bold whitespace-nowrap tabular-nums",
            countClassName,
          )}
        >
          {formatCompactCount(count)}
        </span>
      ) : null}
    </div>
  );

  const className = "group shrink-0 py-1 pr-2 cursor-pointer hover:opacity-90 transition-opacity";

  const action = href ? (
    <Link href={href} aria-label={title} onClick={onClick} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" aria-label={title} onClick={onClick} className={className}>
      {body}
    </button>
  );

  if (!title) return action;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{action}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {title}
        </TooltipContent>
      </Tooltip>
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

  // Zustand Stores
  const volume = usePlayerStore((s) => s.volume);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = usePlayerStore((s) => s.currentSongDetail);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);

  const likelist = useUserStore((s) => s.likeListIDs) || [];
  const isLiked = Array.isArray(likelist) ? likelist.includes(currentSong?.id ?? -1) : false;
  const isLyricOpen = useUiStore((s) => s.isLyricsOpen);
  const isLyricStageBar = variant === "lyric-stage";
  const { musicQuality } = useMusicQuality();
  const openAudioSettings = useAudioEqualizerStore((state) => state.openDialog);

  // 查找当前选中的音质选项，如果找不到就提供一个兜底
  const currentOption = QUALITY_OPTIONS.find((opt) => opt.value === musicQuality);
  const CurrentIcon = currentOption?.icon ?? Radio;

  useEffect(() => {
    if (!currentSong?.id) return;
    void enrichSongStatsById(currentSong.id, {
      likedCount: currentSong.likedCount,
      commentCount: currentSong.commentCount,
    });
  }, [currentSong?.id, currentSong?.likedCount, currentSong?.commentCount]);

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

  const toggleLike = useCallback(
    async (next: boolean) => {
      const songId = currentSong?.id;
      if (!songId) return;

      try {
        await likeSong(songId, next);
        useUserStore.getState().libraryUpdateTrigger += 1; // 触发喜欢列表更新
        const store = useUserStore.getState();
        const cur = Array.isArray(store.likeListIDs)
          ? store.likeListIDs.map((id) => Number(id))
          : [];
        const idNum = Number(songId);
        const nextList: number[] = next ? [...cur, idNum] : cur.filter((id) => id !== idNum);
        store.setLikeListIDs(nextList);
        void clearPageCache();
        toast.success(next ? t("playlist.table.likedAdded") : t("playlist.table.likedRemoved"));
      } catch (error) {
        console.log("Error toggling like status:", error);
      }
    },
    [currentSong, t],
  );

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
          <div className="bg-surface-elevated shadow-panel group relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md lg:size-14">
            {currentSong?.al?.picUrl ? (
              <Image
                width={56}
                height={56}
                src={(currentSong.al.picUrl || currentSong.al.coverUrl) ?? ""}
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
              className="bg-overlay text-content absolute top-[25%] left-[25%] flex items-center justify-center rounded-full p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:scale-105"
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
                    {lyricsActionLabel}
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
                  className="text-content flex min-w-0 items-center gap-1.5 text-sm font-medium"
                >
                  <span className="cursor-pointer truncate hover:underline">
                    {currentSong.name}
                  </span>
                  <SongVipBadge fee={currentSong.fee} />
                </span>
                <span className="text-content-muted mt-0.5 cursor-pointer truncate text-[11px] font-normal">
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
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="bg-skeleton h-3 w-24 rounded-full" />
                <div className="bg-skeleton h-2.5 w-16 rounded-full" />
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
                title={isLiked ? t("common.action.unlike") : t("common.action.like")}
                onClick={() => void toggleLike(!isLiked)}
              >
                {isLiked ? (
                  <PiHeartFill className="text-brand size-5 lg:size-5.5" />
                ) : (
                  <PiHeartBold className="text-content-muted group-hover:text-content size-5 transition-colors lg:size-5.5" />
                )}
              </PlayerBarStatAction>

              <PlayerBarStatAction
                count={currentSong.commentCount}
                countClassName="text-content-muted group-hover:text-content transition-colors"
                href={`/comment?songId=${currentSong.id}`}
                title={t("contextMenu.comments")}
              >
                <PiChatCircleDotsBold className="text-content-muted group-hover:text-content size-5 transition-colors lg:size-5.5" />
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
                      "after:bg-brand after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
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
                    onClick={() => void playPrev()}
                    className="text-content-muted hover:text-content transition-colors"
                  >
                    <SkipBack className="size-4 fill-current lg:size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {t("ui.previous")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={playbackActionLabel}
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={!currentSong}
                    className="bg-content text-surface hover:bg-content/90 flex size-9 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-40 lg:size-10"
                  >
                    {isPlaying ? (
                      <Pause className="size-4 fill-current lg:size-5" />
                    ) : (
                      <Play className="size-4 fill-current lg:size-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {playbackActionLabel}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("ui.next")}
                    onClick={() => void playNext()}
                    className="text-content-muted hover:text-content transition-colors"
                  >
                    <SkipForward className="size-4 fill-current lg:size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {t("ui.next")}
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
                      "after:bg-brand after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
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
            "text-content-muted flex items-center justify-end gap-2 lg:gap-3",
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
                  className={`hover:text-content transition-colors ${isLyricsOpen ? "text-brand" : ""}`}
                >
                  <Mic2 className="size-4 lg:size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {lyricsActionLabel}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 音频设置 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={t("audioSettings.open")}
                  onClick={() => openAudioSettings("quality")}
                  className="hover:text-content flex cursor-pointer items-center justify-center transition-colors"
                >
                  <CurrentIcon className="size-4 lg:size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {t("audioSettings.title")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 播放列表模态界面 */}
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
                    className="hover:text-content flex items-center justify-center transition-colors"
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
            onChange={(v) => usePlayerStore.getState().setVolume(v)}
          />

          {/* 最大化/最小化按钮 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={fullscreenActionLabel}
                  onClick={() => void toggleApplicationFullscreen()}
                  className="hover:text-content hidden transition-colors sm:block"
                >
                  {isFullscreen ? (
                    <MinimizeIcon className="size-4 lg:size-5" />
                  ) : (
                    <Expand className="size-4 lg:size-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {fullscreenActionLabel}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
