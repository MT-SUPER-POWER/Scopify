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
import { audioManager } from "@/components/PlayBar/AudioManager";
import { QueuePopover } from "@/components/QueuePopover";
import { VolumeControl } from "@/components/VolumeControl";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { getSongUrlWithQuality, UI_QUALITY_TO_LEVEL } from "@/lib/api/music";
import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { enrichSongStatsById } from "@/lib/song/enrichSongStats";
import { cn, formatCompactCount, IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useTimeStore } from "@/store/module/time";
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
            "flex min-w-[16px] items-center justify-center px-1 py-px rounded-full bg-[#9f9faa]/20 backdrop-blur-md border border-white/10 text-white shadow-sm",
            "text-[9px] font-bold text-white leading-none tabular-nums whitespace-nowrap pointer-events-none",
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
  onCloseLyricModal,
  style,
  bgClass,
  variant = "default",
}: {
  className?: string;
  onCloseLyricModal?: () => void;
  style?: React.CSSProperties;
  bgClass?: string;
  variant?: "default" | "lyric-modal";
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
  const isLyricModalBar = variant === "lyric-modal";
  const musicQuality = usePlayerStore((s) => s.musicQuality);
  const setMusicQuality = usePlayerStore((s) => s.setMusicQuality);

  // 查找当前选中的音质选项，如果找不到就提供一个兜底
  const currentOption = QUALITY_OPTIONS.find((opt) => opt.value === musicQuality);
  const CurrentIcon = currentOption ? currentOption.icon : Radio;

  const handleQualityChange = async (quality: any) => {
    setMusicQuality(quality);
    if (currentSong?.id) {
      try {
        // 同步当前的精确进度到 timeStore
        if (audioManager.audio) {
          useTimeStore.getState().setCurrentTime(audioManager.audio.currentTime * 1000);
        }

        // 获取新音质的链接
        const level = UI_QUALITY_TO_LEVEL[quality] || "exhigh";
        const urlRes = await getSongUrlWithQuality(currentSong.id, level);
        if (urlRes.data) {
          usePlayerStore.setState({ currentSongUrl: urlRes.data });
        }
      } catch (err) {
        console.error("切换音质重载播放链接失败", err);
      }
    }
  };

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
        await likeSong(currentSong?.id as number, next);
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
        "h-17 lg:h-20 w-full flex items-center justify-between z-20 transition-all ease-linear duration-300",
        bgClass || "bg-black",
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          "h-17 lg:h-20 w-full px-4 items-center z-20 transition-all ease-linear duration-300",
          isLyricModalBar
            ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4"
            : "flex justify-between",
        )}
      >
        {/* ================= Left: Song Info ================= */}
        <div
          className={cn(
            "flex items-center gap-3 lg:gap-4 min-w-0",
            isLyricModalBar ? "justify-start" : "flex-1 lg:flex-3",
          )}
        >
          {/* 专辑封面 */}
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-md overflow-hidden relative group cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-zinc-800 shrink-0">
            {currentSong?.al?.picUrl ? (
              <Image
                width={56}
                height={56}
                src={currentSong.al.picUrl || currentSong.al.coverUrl || ""}
                alt={currentSong.al.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
            <div
              onClick={openLyrics}
              className="absolute top-[25%] left-[25%] opacity-0 group-hover:opacity-100 bg-black/70 rounded-full p-1 transition-opacity backdrop-blur-sm hover:scale-105 hover:bg-black/80 flex items-center justify-center"
            >
              {isLyricOpen ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCloseLyricModal) onCloseLyricModal();
                    else closeLyrics();
                  }}
                >
                  <ChevronDown className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLyrics();
                  }}
                >
                  <ChevronUp className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* 歌曲的名字和歌手 */}
          <div
            className={cn(
              "flex flex-col justify-center min-w-0 flex-1",
              isLyricModalBar ? "max-w-[min(26vw,280px)]" : "max-w-25 lg:max-w-35",
            )}
          >
            {currentSong ? (
              <>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCloseLyricModal) onCloseLyricModal();
                    else closeLyrics();
                  }}
                  className="text-sm text-white hover:underline cursor-pointer truncate font-medium"
                >
                  {currentSong.name}
                </span>
                <span className="text-[11px] text-[#b3b3b3] mt-0.5 font-normal truncate cursor-pointer">
                  {currentSong?.ar?.slice(0, 2).map((a, idx, arr) => (
                    <span
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (useUiStore.getState().isLyricsOpen) onCloseLyricModal?.();
                        smartRouter.push(`/artist?id=${a.id}`);
                      }}
                      title={`/artist?id=${a.id}`}
                      className="hover:underline hover:text-white"
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
              "hidden sm:flex items-center gap-4 lg:gap-5 shrink-0",
              isLyricModalBar && "hidden",
            )}
          >
            <PlayerBarStatAction
              count={currentSong?.likedCount}
              countClassName={isLiked ? "text-[#1ed760]" : "text-zinc-300"}
              title={isLiked ? t("common.action.unlike") : t("common.action.like")}
              onClick={() => toggleLike(!isLiked)}
            >
              {isLiked ? (
                <PiHeartFill className="w-5 h-5 lg:w-[22px] lg:h-[22px] text-[#1ed760]" />
              ) : (
                <PiHeartBold className="w-5 h-5 lg:w-[22px] lg:h-[22px] text-zinc-400 group-hover:text-white transition-colors" />
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
              <PiChatCircleDotsBold className="w-5 h-5 lg:w-[22px] lg:h-[22px] text-zinc-400 group-hover:text-white transition-colors" />
            </PlayerBarStatAction>
          </div>
        </div>

        {/* ================= Center: Controls ================= */}
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 min-w-0",
            isLyricModalBar ? "w-[clamp(280px,40vw,560px)]" : "flex-2 lg:flex-4",
          )}
        >
          <div className="flex items-center gap-4 lg:gap-5 mt-1">
            <button
              type="button"
              onClick={toggleShuffle}
              className={cn(
                "hidden sm:block transition-colors relative",
                isShuffle ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full",
                isShuffle ? "after:opacity-100" : "after:opacity-0",
              )}
            >
              <Shuffle className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            <button
              type="button"
              onClick={() => playPrev()}
              className="text-[#b3b3b3] hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white
              text-black hover:scale-105 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={() => playNext()}
              className="text-[#b3b3b3] hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4 lg:w-5 lg:h-5 fill-current" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={cn(
                "hidden sm:block transition-colors relative",
                repeatMode !== "off" ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white",
                "after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#1ed760] after:rounded-full",
                repeatMode !== "off" ? "after:opacity-100" : "after:opacity-0",
              )}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-4 h-4 lg:w-5 lg:h-5" />
              ) : (
                <Repeat className="w-4 h-4 lg:w-5 lg:h-5" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex w-full h-4">
            <PlayerProgressBar />
          </div>
        </div>

        {/* ================= Right: Extra Controls ================= */}
        <div
          className={cn(
            "flex items-center justify-end gap-2 lg:gap-3 text-[#b3b3b3]",
            isLyricModalBar ? "min-w-0" : "flex-1 lg:flex-3",
          )}
        >
          {/* 歌词模态界面 */}
          <button
            type="button"
            onClick={() => toggleLyrics()}
            className={`hover:text-white transition-colors ${isLyricsOpen ? "text-[#1db954]" : ""}`}
          >
            <Mic2 className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>

          {/* 音质选择 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hover:text-white transition-colors flex items-center justify-center"
                title={t("playbar.quality")}
              >
                <CurrentIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-[#282828] border-white/10 text-white p-2 w-64 rounded-xl"
              side="top"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="text-xs text-zinc-400 px-2 py-1 font-normal">
                {t("playbar.qualityTitle")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuRadioGroup
                value={musicQuality}
                onValueChange={(v) => handleQualityChange(v as any)}
              >
                {QUALITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <DropdownMenuRadioItem
                      key={opt.value}
                      value={opt.value}
                      className="rounded-lg px-3 py-2.5 text-[15px] focus:bg-white/10 focus:text-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-5 h-5 shrink-0 text-zinc-300" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {t(opt.labelKey)}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5">
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
              className="hover:text-white transition-colors flex items-center justify-center"
            >
              <MonitorSpeaker className="w-4 h-4 lg:w-5 lg:h-5" />
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
            className="hidden sm:block hover:text-white transition-colors"
          >
            {isMaximized ? (
              <MinimizeIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            ) : (
              <Expand className="w-4 h-4 lg:w-5 lg:h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
