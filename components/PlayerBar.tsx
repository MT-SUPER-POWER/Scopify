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
import { useCallback, useEffect, useState } from "react";
import { PiChatCircleDotsBold, PiHeartBold, PiHeartFill } from "react-icons/pi"; // 引入更圆润的 Phosphor Icons 图标
import { toast } from "sonner";
import { QueuePopover } from "@/components/QueuePopover";
import { VolumeControl } from "@/components/VolumeControl";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { enrichSongStatsById } from "@/lib/song/enrichSongStats";
import { cn, formatCompactCount, IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { QualityOptionKey } from "@/types/playerBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Maximized = (isElectron: boolean) => {
  if (isElectron) window.electronAPI?.enterFullScreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
};

const Minimize = (isElectron: boolean) => {
  if (isElectron) window.electronAPI?.exitFullScreen();
  else if (document.fullscreenElement) document.exitFullscreen();
};

/** 图标右上角数字（PlayerBar 专用） */
// BUG: hover 时，数字会被下面的 ICON 盖住（好像是因为毛玻璃的 BUG 导致的计算渲染问题）
function PlayerBarStatAction({
  count,
  countClassName,
  onClick,
  href,
  title,
  children,
}: {
  count?: number;
  countClassName?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  href?: string;
  title?: string;
  children: React.ReactNode;
}) {
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
            "flex min-w-4 items-center justify-center rounded-full border border-white/10 bg-[#9f9faa]/20 px-1 py-px text-white shadow-sm backdrop-blur-md",
            "pointer-events-none text-[9px] leading-none font-bold whitespace-nowrap text-white tabular-nums",
            countClassName,
          )}
        >
          {formatCompactCount(count)}
        </span>
      ) : null}
    </div>
  );

  const className = "group shrink-0 py-1 pr-2 cursor-pointer hover:opacity-90 transition-opacity";

  if (href) {
    return (
      <Link href={href} title={title} onClick={onClick} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" title={title} onClick={onClick} className={className}>
      {body}
    </button>
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
  const isElectron = IS_ELECTRON;
  const isLyricsOpen = useUiStore((s) => s.isLyricsOpen);
  const toggleLyrics = useUiStore((s) => s.toggleLyrics);
  const [isMaximized, setIsMaximized] = useState(false);
  const openLyrics = () => useUiStore.getState().setIsLyricsOpen(true);
  const closeLyrics = () => useUiStore.getState().setIsLyricsOpen(false);
  const smartRouter = useSmartRouter();

  // 检测 F11 浏览器全屏（非 requestFullscreen）
  useEffect(() => {
    const checkFullScreen = () => {
      // 通过窗口尺寸和屏幕尺寸判断是否全屏
      const isBrowserFullScreen =
        window.innerHeight === screen.height &&
        window.innerWidth === screen.width &&
        !document.fullscreenElement;
      setIsMaximized(!!document.fullscreenElement || isBrowserFullScreen);
    };
    window.addEventListener("resize", checkFullScreen);
    document.addEventListener("fullscreenchange", checkFullScreen);
    checkFullScreen();
    return () => {
      window.removeEventListener("resize", checkFullScreen);
      document.removeEventListener("fullscreenchange", checkFullScreen);
    };
  }, []);

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
  const { changeMusicQuality, musicQuality } = useMusicQuality();

  // 查找当前选中的音质选项，如果找不到就提供一个兜底
  const currentOption = QUALITY_OPTIONS.find((opt) => opt.value === musicQuality);
  const CurrentIcon = currentOption ? currentOption.icon : Radio;

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

  const toggleLike = useCallback(
    async (next: boolean) => {
      try {
        await likeSong(currentSong?.id!, next);
        useUserStore.getState().libraryUpdateTrigger += 1; // 触发喜欢列表更新
        const store = useUserStore.getState();
        const cur = Array.isArray(store.likeListIDs)
          ? store.likeListIDs.map((id) => Number(id))
          : [];
        const idNum = Number(currentSong?.id);
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
        bgClass ?? "bg-black",
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          "z-20 h-17 w-full items-center px-4 transition-all duration-300 ease-linear lg:h-20",
          isLyricStageBar
            ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4"
            : "flex justify-between",
        )}
      >
        {/* ================= Left: Song Info ================= */}
        <div
          className={cn(
            "flex min-w-0 items-center gap-3 lg:gap-4",
            isLyricStageBar ? "justify-start" : "flex-1 lg:flex-3",
          )}
        >
          {/* 专辑封面 */}
          <div className="group relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-md bg-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.5)] lg:size-14">
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
              className="absolute top-[25%] left-[25%] flex items-center justify-center rounded-full bg-black/70 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:scale-105 hover:bg-black/80"
            >
              {isLyricOpen ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCloseLyricStage) onCloseLyricStage();
                    else closeLyrics();
                  }}
                >
                  <ChevronDown className="size-5 text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLyrics();
                  }}
                >
                  <ChevronUp className="size-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* 歌曲的名字和歌手 */}
          <div
            className={cn(
              "flex min-w-0 flex-col justify-center",
              isLyricStageBar ? "max-w-[min(26vw,280px)]" : "max-w-30 sm:max-w-40 lg:max-w-60",
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
                  className="cursor-pointer truncate text-sm font-medium text-white hover:underline"
                >
                  {currentSong.name}
                </span>
                <span className="mt-0.5 cursor-pointer truncate text-[11px] font-normal text-[#b3b3b3]">
                  {currentSong?.ar?.slice(0, 2).map((a, idx, arr) => (
                    <span
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (useUiStore.getState().isLyricsOpen) onCloseLyricStage?.();
                        smartRouter.push(`/artist?id=${a.id}`);
                      }}
                      title={`/artist?id=${a.id}`}
                      className="hover:text-white hover:underline"
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
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-2.5 w-16 rounded-full bg-white/10" />
              </div>
            )}
          </div>

          {/* 点赞和评论 */}
          <div
            className={cn(
              "hidden shrink-0 items-center gap-4 sm:flex lg:gap-5",
              isLyricStageBar && "hidden",
            )}
          >
            <PlayerBarStatAction
              count={currentSong?.likedCount}
              countClassName={isLiked ? "text-[#1ed760]" : "text-zinc-300"}
              title={isLiked ? t("common.action.unlike") : t("common.action.like")}
              onClick={() => toggleLike(!isLiked)}
            >
              {isLiked ? (
                <PiHeartFill className="size-5 text-[#1ed760] lg:size-5.5" />
              ) : (
                <PiHeartBold className="size-5 text-zinc-400 transition-colors group-hover:text-white lg:size-5.5" />
              )}
            </PlayerBarStatAction>

            <PlayerBarStatAction
              count={currentSong?.commentCount}
              countClassName="text-zinc-300 group-hover:text-white transition-colors"
              href={currentSong?.id ? `/comment?songId=${currentSong.id}` : "#"}
              title={t("contextMenu.comments")}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!currentSong?.id) e.preventDefault();
              }}
            >
              <PiChatCircleDotsBold className="size-5 text-zinc-400 transition-colors group-hover:text-white lg:size-5.5" />
            </PlayerBarStatAction>
          </div>
        </div>

        {/* ================= Center: Controls ================= */}
        <div
          className={cn(
            "flex min-w-0 flex-col items-center justify-center gap-1.5",
            isLyricStageBar ? "w-[clamp(280px,40vw,560px)]" : "flex-2 lg:flex-4",
          )}
        >
          <div className="mt-1 flex items-center gap-4 lg:gap-5">
            <button
              type="button"
              onClick={toggleShuffle}
              className={cn(
                "relative hidden transition-colors sm:block",
                isShuffle ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-[#1ed760] after:content-['']",
                isShuffle ? "after:opacity-100" : "after:opacity-0",
              )}
            >
              <Shuffle className="size-4 lg:size-5" />
            </button>
            <button
              type="button"
              onClick={() => playPrev()}
              className="text-[#b3b3b3] transition-colors hover:text-white"
            >
              <SkipBack className="size-4 fill-current lg:size-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className="flex size-9 items-center justify-center rounded-full bg-white text-black transition-all hover:scale-105 hover:bg-gray-200 active:scale-95 disabled:opacity-40 lg:size-10"
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current lg:size-5" />
              ) : (
                <Play className="size-4 fill-current lg:size-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => playNext()}
              className="text-[#b3b3b3] transition-colors hover:text-white"
            >
              <SkipForward className="size-4 fill-current lg:size-5" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={cn(
                "relative hidden transition-colors sm:block",
                repeatMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:absolute after:-bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-[#1ed760] after:content-['']",
                repeatMode !== "off" ? "after:opacity-100" : "after:opacity-0",
              )}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="size-4 lg:size-5" />
              ) : (
                <Repeat className="size-4 lg:size-5" />
              )}
            </button>
          </div>

          <div className="hidden h-4 w-full sm:flex">
            <PlayerProgressBar />
          </div>
        </div>

        {/* ================= Right: Extra Controls ================= */}
        <div
          className={cn(
            "flex items-center justify-end gap-2 text-[#b3b3b3] lg:gap-3",
            isLyricStageBar ? "min-w-0" : "flex-1 lg:flex-3",
          )}
        >
          {/* Lyric Stage */}
          <button
            type="button"
            onClick={() => toggleLyrics()}
            title={t("playerBar.lyrics")}
            aria-label={t("playerBar.lyrics")}
            className={`transition-colors hover:text-white ${isLyricsOpen ? "text-[#1db954]" : ""}`}
          >
            <Mic2 className="size-4 lg:size-5" />
          </button>

          {/* 音质选择 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center transition-colors hover:text-white"
                title={t("playbar.quality")}
              >
                <CurrentIcon className="size-4 lg:size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-xl border-white/10 bg-[#282828] p-2 text-white"
              side="top"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="px-2 py-1 text-xs font-normal text-zinc-400">
                {t("playbar.qualityTitle")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuRadioGroup
                value={musicQuality}
                onValueChange={(v) => void changeMusicQuality(v as QualityOptionKey)}
              >
                {QUALITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <DropdownMenuRadioItem
                      key={opt.value}
                      value={opt.value}
                      className="rounded-lg px-3 py-2.5 text-[15px] focus:bg-white/10 focus:text-white"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon className="size-5 shrink-0 text-zinc-300" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">
                            {t(opt.labelKey)}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-zinc-400">
                            {t(opt.sublabelKey)} · {t(opt.descriptionKey)}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
            <button
              type="button"
              className="flex items-center justify-center transition-colors hover:text-white"
            >
              <MonitorSpeaker className="size-4 lg:size-5" />
            </button>
          </div>

          {/* 音量控制 */}
          <VolumeControl
            initialVolume={volume}
            onChange={(v) => usePlayerStore.getState().setVolume(v)}
          />

          {/* 最大化/最小化按钮 */}
          <button
            type="button"
            onClick={() => {
              if (isMaximized) {
                Minimize(isElectron);
              } else {
                Maximized(isElectron);
              }
              setIsMaximized(!isMaximized);
            }}
            className="hidden transition-colors hover:text-white sm:block"
          >
            {isMaximized ? (
              <MinimizeIcon className="size-4 lg:size-5" />
            ) : (
              <Expand className="size-4 lg:size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
