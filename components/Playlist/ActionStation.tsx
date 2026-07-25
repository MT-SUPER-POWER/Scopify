"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  CalendarDays,
  List,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { enUS, zhCN, zhTW } from "react-day-picker/locale";
import type { PlaylistActionsProps } from "@/types/components/playlist";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useHistoricalDailyRecommendations } from "@/hooks/playlist/useHistoricalDailyRecommendations";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(date: string) {
  return new Date(`${date}T00:00:00`);
}

export default function PlaylistActions(props: PlaylistActionsProps) {
  const { locale, t } = useI18n();
  const {
    playlistId,
    isDaily,
    dailyDate,
    searchOpen,
    searchQuery,
    onSearchChange,
    onSearchOpen,
    onSearchClose,
    inputRef,
  } = props;

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const smartRouter = useSmartRouter();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const history = useHistoricalDailyRecommendations();
  const availableHistoryDateSet = useMemo(
    () => new Set(history.data?.dates ?? []),
    [history.data?.dates],
  );
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);
  const selectedCalendarDate = dailyDate ? parseDateKey(dailyDate) : today;
  const calendarLocale = locale === "zh-CN" ? zhCN : locale === "zh-TW" ? zhTW : enUS;
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const storePlaylistId = usePlayerStore((s) => s.playlistId);
  const albumList = useUserStore((s) => s.albumList);
  const currentPageId =
    playlistId ?? (isDaily ? (dailyDate ? `daily:${dailyDate}` : "daily") : null);
  const isCurrentQueue = Boolean(storePlaylistId) && storePlaylistId === currentPageId;
  const showPause = isCurrentQueue && isPlaying; // 只有“是当前歌单”且“正在播放”时，才显示暂停键

  const handlePlayToggle = () => {
    const state = usePlayerStore.getState();
    if (!albumList.length) return;

    if (isCurrentQueue) {
      state.setIsPlaying(!state.isPlaying); // 如果已经是当前歌单，直接切换 播放/暂停 状态
    } else {
      // 否则，用当前页面的歌单替换播放队列，并从头播放 (复用 currentPageId)
      state.setQueue(albumList, 0, currentPageId);
      state.playQueueIndex(0);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    const selectedDateKey = formatDateKey(date);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (selectedDateKey === todayKey) {
      nextParams.delete("dailyDate");
    } else {
      nextParams.set("dailyDate", selectedDateKey);
    }
    smartRouter.replace(`${pathname}?${nextParams.toString()}`);
    setIsCalendarOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-6">
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <button
          onClick={handlePlayToggle}
          disabled={!currentSongDetail && !albumList.length}
          className="flex size-14 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-lg transition-all hover:scale-105 hover:bg-[#3be477] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showPause ? (
            <Pause className="ml-0.5 size-6 fill-current" />
          ) : (
            <Play className="ml-1.5 size-6 fill-current" />
          )}
        </button>

        <button
          onClick={toggleShuffle}
          className="relative inline-flex cursor-pointer items-center justify-center"
        >
          <Shuffle
            className={cn(
              "size-8 transition-colors",
              isShuffle ? "text-[#1ed760]" : "text-zinc-400 hover:text-white",
            )}
          />
          {isShuffle && (
            <span className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[#1ed760]" />
          )}
        </button>

        <ArrowDownCircle className="size-8 cursor-pointer text-zinc-400 transition-colors hover:text-white" />
        {/* TODO: 实现更多选项
            1. 根据是歌单还是每日推荐 / 专辑 做区分
            2. 歌单：更新歌单封面、编辑歌单信息、分享歌单
            3. 专辑：分享专辑、收藏/取消收藏专辑
         */}
        <MoreHorizontal className="size-8 cursor-pointer text-zinc-400 transition-colors hover:text-white" />
      </div>

      <div className="flex items-center gap-3">
        {isDaily && (
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <TooltipProvider>
              <Tooltip>
                <PopoverTrigger asChild>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("playlist.actions.historyDate")}
                      className="inline-flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <CalendarDays className="size-4" />
                    </button>
                  </TooltipTrigger>
                </PopoverTrigger>
                <TooltipContent sideOffset={6}>{t("playlist.actions.historyDate")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-auto border-white/10 bg-zinc-950 p-0 text-white"
            >
              <Calendar
                key={dailyDate ?? todayKey}
                mode="single"
                selected={selectedCalendarDate}
                defaultMonth={selectedCalendarDate}
                onSelect={handleCalendarSelect}
                locale={calendarLocale}
                disabled={(date) => {
                  const dateKey = formatDateKey(date);
                  return dateKey !== todayKey && !availableHistoryDateSet.has(dateKey);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div
              key="search-input"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 160, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex items-center gap-1 overflow-hidden rounded-full bg-white/10 px-2 py-1"
            >
              <Search className="size-4 shrink-0 text-zinc-400" />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("playlist.actions.searchPlaceholder")}
                className="w-full bg-transparent text-xs text-white outline-none"
              />
              <button onClick={onSearchClose}>
                <X className="size-3 shrink-0 text-zinc-400 hover:text-white" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="search-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.05, ease: "linear" }}
              onClick={onSearchOpen}
            >
              <Search className="size-4 cursor-pointer text-zinc-400 transition-colors hover:text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        <List className="size-5 text-zinc-400" />
      </div>
    </div>
  );
}
