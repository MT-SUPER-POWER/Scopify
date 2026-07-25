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
import type { PlaylistActionsProps } from "@/types/components/playlist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHistoricalDailyRecommendationDates } from "@/hooks/playlist/useHistoricalDailyRecommendationDates";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

const CURRENT_DAILY_VALUE = "__current_daily__";

export default function PlaylistActions(props: PlaylistActionsProps) {
  const { t } = useI18n();
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
  const { data: historicalDates = [], isLoading: isHistoryLoading } =
    useHistoricalDailyRecommendationDates(isDaily);
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

  const handleDailyDateChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === CURRENT_DAILY_VALUE) {
      nextParams.delete("dailyDate");
    } else {
      nextParams.set("dailyDate", value);
    }
    smartRouter.replace(`${pathname}?${nextParams.toString()}`);
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
        {isDaily && (isHistoryLoading || historicalDates.length > 0) && (
          <Select
            value={dailyDate ?? CURRENT_DAILY_VALUE}
            onValueChange={handleDailyDateChange}
            disabled={isHistoryLoading}
          >
            <SelectTrigger
              size="sm"
              aria-label={t("playlist.actions.historyDate")}
              className="border-white/15 bg-white/10 text-zinc-200 hover:bg-white/15"
            >
              <CalendarDays className="size-4 text-zinc-300" />
              <SelectValue placeholder={t("playlist.actions.historyLoading")} />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900 text-zinc-100">
              <SelectItem value={CURRENT_DAILY_VALUE}>
                {t("playlist.actions.currentDaily")}
              </SelectItem>
              {historicalDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-4">
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

        <div className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white">
          <span>{t("playlist.actions.listLabel")}</span>
          <List className="size-5" />
        </div>
      </div>
    </div>
  );
}
