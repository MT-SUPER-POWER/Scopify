"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@scopify/ui/shadcn/components/badge";
import {
  ArrowDownCircle,
  CalendarDays,
  List,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { enUS, zhCN, zhTW } from "react-day-picker/locale";
import { toast } from "sonner";
import type { PlaylistActionsProps } from "@/types/components/playlist";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { useCommentCountQuery } from "@/hooks/comment/useCommentCountQuery";
import { useHistoricalDailyRecommendations } from "@/hooks/playlist/useHistoricalDailyRecommendations";
import { usePlaylistSearchShortcut } from "@/hooks/playlist/usePlaylistSearchShortcut";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { getCommentHref } from "@/lib/comment/commentResource";
import { cn, formatCompactCount } from "@/lib/utils";
import { usePlayerStore } from "@/store";
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

function getHistoryRequestErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export default function PlaylistActions(props: PlaylistActionsProps) {
  const { locale, t } = useI18n();
  const {
    actionSlot,
    commentResourceId,
    commentResourceKind,
    playlistId,
    playSourceId,
    isDaily,
    isSticky = false,
    dailyDate,
    searchOpen,
    searchQuery,
    onSearchChange,
    onSearchOpen,
    onSearchClose,
    inputRef,
    tracks,
  } = props;

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const smartRouter = useSmartRouter();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  usePlaylistSearchShortcut({ inputRef, onSearchOpen });
  const history = useHistoricalDailyRecommendations(isCalendarOpen);
  const reportedHistoryDataAt = useRef(0);
  const reportedHistoryErrorAt = useRef(0);
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
  const { data: commentCount } = useCommentCountQuery(
    commentResourceKind,
    commentResourceId ?? null,
  );
  const storePlaylistId = usePlayerStore((s) => s.playlistId);
  const currentPageId =
    playSourceId ?? playlistId ?? (isDaily ? (dailyDate ? `daily:${dailyDate}` : "daily") : null);
  const isCurrentQueue = Boolean(storePlaylistId) && storePlaylistId === currentPageId;
  const showPause = isCurrentQueue && isPlaying; // 只有“是当前歌单”且“正在播放”时，才显示暂停键

  useEffect(() => {
    if (
      !isCalendarOpen ||
      !history.error ||
      history.errorUpdatedAt === reportedHistoryErrorAt.current
    )
      return;

    reportedHistoryErrorAt.current = history.errorUpdatedAt;
    toast.error(
      getHistoryRequestErrorMessage(history.error, t("playlist.actions.historyLoadFailed")),
    );
  }, [history.error, history.errorUpdatedAt, isCalendarOpen, t]);

  useEffect(() => {
    const message = history.data?.noHistoryMessage;
    if (!isCalendarOpen || !message || history.dataUpdatedAt === reportedHistoryDataAt.current)
      return;

    reportedHistoryDataAt.current = history.dataUpdatedAt;
    toast.info(message || t("playlist.actions.historyRequiresVip"));
  }, [history.data?.noHistoryMessage, history.dataUpdatedAt, isCalendarOpen, t]);

  const handlePlayToggle = () => {
    const state = usePlayerStore.getState();
    if (!tracks.length) return;

    if (isCurrentQueue) {
      state.setIsPlaying(!state.isPlaying); // 如果已经是当前歌单，直接切换 播放/暂停 状态
    } else {
      // 否则，用当前页面的歌单替换播放队列，并从头播放 (复用 currentPageId)
      state.setQueue(tracks, 0, currentPageId);
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

  const playbackActionLabel = t(showPause ? "ui.pause" : "ui.play");
  const shuffleActionLabel = t(isShuffle ? "ui.shuffleOn" : "ui.shuffleOff");
  const commentActionLabel =
    commentCount === undefined
      ? t("playlist.actions.comments")
      : t("playlist.actions.commentsWithCount", {
          count: formatCompactCount(commentCount),
        });

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex min-h-26 flex-wrap items-center justify-between gap-4 p-6 transition-[gap,padding] duration-200 md:px-8 lg:px-10 xl:px-12",
          isSticky && "h-16 min-h-0 flex-nowrap gap-3 overflow-x-auto py-2",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-4 md:gap-6",
            isSticky && "shrink-0 flex-nowrap gap-3 md:gap-4",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={playbackActionLabel}
                onClick={handlePlayToggle}
                disabled={!currentSongDetail && !tracks.length}
                className={cn(
                  "flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-all hover:scale-105 hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50",
                  isSticky && "size-12",
                )}
              >
                {showPause ? (
                  <Pause className={cn("ml-0.5 size-6 fill-current", isSticky && "size-5")} />
                ) : (
                  <Play className={cn("ml-1.5 size-6 fill-current", isSticky && "size-5")} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {playbackActionLabel}
            </TooltipContent>
          </Tooltip>

          {actionSlot}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={shuffleActionLabel}
                onClick={toggleShuffle}
                className="relative inline-flex cursor-pointer items-center justify-center"
              >
                <Shuffle
                  className={cn(
                    isSticky ? "size-7" : "size-8",
                    "transition-colors",
                    isShuffle ? "text-brand" : "text-content-muted hover:text-content",
                  )}
                />
                {isShuffle && (
                  <span className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {shuffleActionLabel}
            </TooltipContent>
          </Tooltip>

          {commentResourceKind && commentResourceId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={commentActionLabel}
                  onClick={() =>
                    smartRouter.push(getCommentHref(commentResourceKind, commentResourceId))
                  }
                  className="relative inline-flex cursor-pointer items-center justify-center text-content-muted transition-colors hover:text-content"
                >
                  <MessageCircle className={cn(isSticky ? "size-7" : "size-8")} />
                  {commentCount !== undefined && (
                    <Badge
                      variant="outline"
                      className="pointer-events-none absolute top-0 right-0 h-4 min-w-4 translate-x-1/2 -translate-y-1/3 border-border bg-surface-overlay px-1 text-[9px] leading-none text-content-muted tabular-nums shadow-panel backdrop-blur-sm"
                    >
                      {formatCompactCount(commentCount)}
                    </Badge>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {commentActionLabel}
              </TooltipContent>
            </Tooltip>
          )}

          <ArrowDownCircle
            className={cn(
              isSticky ? "size-7" : "size-8",
              "cursor-pointer text-content-muted transition-colors hover:text-content",
            )}
          />
          {/* TODO: 实现更多选项
            1. 根据是歌单还是每日推荐 / 专辑 做区分
            2. 歌单：更新歌单封面、编辑歌单信息、分享歌单
            3. 专辑：分享专辑、收藏/取消收藏专辑
         */}
          <MoreHorizontal
            className={cn(
              isSticky ? "size-7" : "size-8",
              "cursor-pointer text-content-muted transition-colors hover:text-content",
            )}
          />
        </div>

        <div className={cn("flex shrink-0 items-center gap-3", isSticky && "gap-2")}>
          {isDaily && (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <TooltipProvider>
                <Tooltip>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("playlist.actions.historyDate")}
                        className="inline-flex size-8 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-content/10 hover:text-content"
                      >
                        <CalendarDays className="size-4" />
                      </button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent sideOffset={6}>
                    {t("playlist.actions.historyDate")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-auto border-border bg-surface-overlay p-0 text-content"
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
                className="flex items-center gap-1 overflow-hidden rounded-full bg-content/10 px-2 py-1"
              >
                <Search className="size-4 shrink-0 text-content-muted" />
                <input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t("playlist.actions.searchPlaceholder")}
                  className="w-full bg-transparent text-xs text-content outline-none"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("common.action.close")}
                      onClick={onSearchClose}
                    >
                      <X className="size-3 shrink-0 text-content-muted hover:text-content" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {t("common.action.close")}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    key="search-icon"
                    type="button"
                    aria-label={t("playlist.actions.searchPlaceholder")}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.05, ease: "linear" }}
                    onClick={onSearchOpen}
                  >
                    <Search className="size-4 cursor-pointer text-content-muted transition-colors hover:text-content" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  <ShortcutHint
                    commandId="focus-playlist-search"
                    label={t("playlist.actions.searchPlaceholder")}
                  />
                </TooltipContent>
              </Tooltip>
            )}
          </AnimatePresence>

          <List className="size-5 text-content-muted" />
        </div>
      </div>
    </TooltipProvider>
  );
}
