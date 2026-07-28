"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronUp, Clock, GripVertical, RefreshCw } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { TracklistTableProps } from "@/types/components/playlist";

import {
  useNavigationScrollRestorationAdapter,
  usePrimaryScrollSurface,
} from "@/components/shared/NavigationScrollProvider";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDailyRecommendationMutation } from "@/hooks/playlist/useDailyRecommendationMutation";
import { usePlaylistTrackMutation } from "@/hooks/playlist/usePlaylistTrackMutation";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { clearPageCache } from "@/lib/cache/pageCache";
import { cn } from "@/lib/utils";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { NavigationScrollRestorationAdapter } from "@/types/navigation-scroll";

import { ConfirmDialogShandCN } from "./TableConfirmDialog";
import { TrackRow } from "./TrackRow";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COL RESIZE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MIN_COL = 60;
const COMPACT_ALBUM_MIN = 96;
const COMPACT_DURATION_MIN = 56;
const COMPACT_TITLE_MIN = 160;

type SortDirection = "asc" | "desc";
type SortField = "album" | "date" | "like" | "title" | null;

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TracklistTable({
  disableVirtualization = false,
  emptyActionLabel,
  hideDateColumn = false,
  hideLikeColumn = false,
  onEmptyAction,
  onTracksChange,
  dailyRecommendationMode,
  playSourceId,
  readonly = false,
  searchQuery,
  tracks: externalTracks,
}: TracklistTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [colTitle, setColTitleState] = useState(300);
  const [colAlbum, setColAlbumState] = useState(200);
  const [colDate, setColDateState] = useState(140);
  const [colLike, setColLikeState] = useState(80);
  const [compactAlbumWidth, setCompactAlbumWidth] = useState<number | null>(null);
  const [compactDurationWidth, setCompactDurationWidth] = useState(64);
  const colTitleRef = useRef(300);
  const colAlbumRef = useRef(200);
  const colDateRef = useRef(140);
  const colLikeRef = useRef(80);
  const showAlbumColumn = useMediaQuery("(min-width: 640px)");
  const showExtendedColumns = useMediaQuery("(min-width: 1024px)");
  const showDateColumn = showExtendedColumns && !hideDateColumn;
  const showLikeColumn = showExtendedColumns && !hideLikeColumn;
  const compactFixedWidth = 40 + compactDurationWidth;
  const compactTitleWidth = showAlbumColumn
    ? compactAlbumWidth === null
      ? `calc(70% - ${compactFixedWidth}px)`
      : `calc(100% - ${compactFixedWidth + compactAlbumWidth}px)`
    : `calc(100% - ${compactFixedWidth}px)`;
  const titleColumnStyle = showExtendedColumns
    ? { minWidth: 60, width: colTitle }
    : { width: compactTitleWidth };
  const albumColumnStyle = showExtendedColumns
    ? { minWidth: 64, width: colAlbum }
    : { width: compactAlbumWidth ?? "30%" };
  const visibleColumnCount =
    3 + Number(showAlbumColumn) + Number(showDateColumn) + Number(showLikeColumn);
  const setColTitle = (w: number) => {
    colTitleRef.current = w;
    setColTitleState(w);
  };
  const setColAlbum = (w: number) => {
    colAlbumRef.current = w;
    setColAlbumState(w);
  };
  const setColDate = (w: number) => {
    colDateRef.current = w;
    setColDateState(w);
  };
  const setColLike = (w: number) => {
    colLikeRef.current = w;
    setColLikeState(w);
  };

  const { t } = useI18n();
  const { mutateAsync: dislikeDailyRecommend } = useDailyRecommendationMutation();
  const { mutateAsync: updatePlaylistTrack } = usePlaylistTrackMutation();
  const searchParams = useSearchParams();
  const playlistID = searchParams.get("id");
  const isDailyRecommendationPage = searchParams.get("isDailyRecommend") === "true";
  const historicalDailyDate = searchParams.get("dailyDate");
  const resolvedDailyRecommendationMode =
    dailyRecommendationMode ??
    (isDailyRecommendationPage ? (historicalDailyDate ? "history" : "current") : undefined);
  const isHistoricalDailyRecommendation = resolvedDailyRecommendationMode === "history";
  const canDislikeDailyRecommendation = resolvedDailyRecommendationMode === "current";
  const dailyQueueId = historicalDailyDate ? `daily:${historicalDailyDate}` : "daily";
  const pathname = usePathname();
  const storePlaylistId = usePlayerStore((s) => s.playlistId);

  const currentPageId = useMemo(() => {
    const isPlaylistOrAlbum = pathname.includes("/playlist") || pathname.includes("/album");
    if (!isPlaylistOrAlbum && playSourceId === undefined) return null;
    return playSourceId ?? playlistID ?? (isDailyRecommendationPage ? dailyQueueId : null);
  }, [pathname, playSourceId, playlistID, isDailyRecommendationPage, dailyQueueId]);

  const isCurrentQueue = useMemo(() => {
    if (currentPageId === null) return true;
    return storePlaylistId === currentPageId;
  }, [currentPageId, storePlaylistId]);
  const [pendingDelete, setPendingDelete] = useState<null | {
    playlistId: number | string | undefined;
    trackId: number;
  }>(null);

  const storeTracks = useUserStore((state) => state.albumList);
  const tracks = externalTracks ?? storeTracks;
  const likelist = useUserStore((s) => s.likeListIDs);

  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const playFromSong = usePlayerStore((s) => s.playFromSong);
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const likeSet = useMemo(() => {
    if (Array.isArray(likelist)) return new Set(likelist);
    return new Set<number>();
  }, [likelist]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery?.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (track) =>
        (track.name?.toLowerCase?.() || "").includes(q) ||
        (Array.isArray(track.ar) &&
          track.ar.some((a) => (a?.name?.toLowerCase?.() || "").includes(q))) ||
        (track.al?.name?.toLowerCase?.() || "").includes(q),
    );
  }, [tracks, searchQuery]);
  const hasSearchQuery = Boolean(searchQuery?.trim());

  const sortedTracks = useMemo(() => {
    if (!sortField) return filteredTracks;
    return [...filteredTracks].sort((a, b) => {
      let val = 0;
      if (sortField === "title") {
        val = (a.name || "").localeCompare(b.name || "");
      } else if (sortField === "album") {
        val = (a.al?.name || "").localeCompare(b.al?.name || "");
      } else if (sortField === "date") {
        val = (a.publishTime || 0) - (b.publishTime || 0);
      } else if (sortField === "like") {
        const aLiked = likeSet.has(a.id) ? 1 : 0;
        const bLiked = likeSet.has(b.id) ? 1 : 0;
        val = aLiked - bLiked;
      }
      return sortDirection === "asc" ? val : -val;
    });
  }, [filteredTracks, sortField, sortDirection, likeSet]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortField(null);
        setSortDirection("desc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const primaryScrollSurface = usePrimaryScrollSurface();
  const virtualRowElementsRef = useRef(new Map<number, HTMLTableRowElement>());

  const virtualizer = useVirtualizer({
    count: sortedTracks.length,
    enabled: !disableVirtualization,
    estimateSize: () => 56,
    getItemKey: (index) => sortedTracks[index]?.id ?? index,
    getScrollElement: () => primaryScrollSurface,
    isScrollingResetDelay: 160,
    overscan: 7,
  });
  const primaryScrollSurfaceRef = useRef(primaryScrollSurface);
  const sortedTracksRef = useRef(sortedTracks);
  const virtualizerRef = useRef(virtualizer);
  primaryScrollSurfaceRef.current = primaryScrollSurface;
  sortedTracksRef.current = sortedTracks;
  virtualizerRef.current = virtualizer;

  const restorationAdapter = useMemo<NavigationScrollRestorationAdapter | null>(() => {
    if (disableVirtualization) return null;

    return {
      capture(surface) {
        const tracks = sortedTracksRef.current;
        const virtualizer = virtualizerRef.current;
        const viewport = surface.getBoundingClientRect();
        const anchor = virtualizer.getVirtualItems().find((virtualItem) => {
          const row = virtualRowElementsRef.current.get(virtualItem.index);
          if (!row) return false;
          const rowRect = row.getBoundingClientRect();
          return rowRect.bottom > viewport.top && rowRect.top < viewport.bottom;
        });
        const track = anchor ? tracks[anchor.index] : undefined;
        const row = anchor ? virtualRowElementsRef.current.get(anchor.index) : undefined;
        if (!anchor || !track || !row) return null;

        return {
          anchorKey: String(track.id),
          anchorOffset: row.getBoundingClientRect().top - viewport.top,
          fallbackTop: surface.scrollTop,
          kind: "virtual-collection",
        };
      },
      getRestoreReadiness({ signal, snapshot, surface }) {
        if (signal.aborted) return "unavailable";
        if (primaryScrollSurfaceRef.current !== surface) return "waiting";

        const tracks = sortedTracksRef.current;
        const targetIndex = tracks.findIndex((track) => String(track.id) === snapshot.anchorKey);
        if (targetIndex < 0) return "unavailable";

        const virtualizer = virtualizerRef.current;
        if (virtualizer.scrollElement !== surface || virtualizer.getVirtualItems().length === 0) {
          return "waiting";
        }

        return "ready";
      },
      async restore({ signal, snapshot, surface }) {
        const tracks = sortedTracksRef.current;
        const targetIndex = tracks.findIndex((track) => String(track.id) === snapshot.anchorKey);
        if (targetIndex < 0 || signal.aborted) return;

        const virtualizer = virtualizerRef.current;
        virtualizer.scrollToIndex(targetIndex, { align: "start", behavior: "auto" });
        await waitForAnimationFrame();
        if (signal.aborted) return;

        const row = virtualRowElementsRef.current.get(targetIndex);
        if (!row) return;

        const viewport = surface.getBoundingClientRect();
        const currentAnchorOffset = row.getBoundingClientRect().top - viewport.top;
        surface.scrollTo({
          behavior: "auto",
          top: surface.scrollTop + currentAnchorOffset - snapshot.anchorOffset,
        });
      },
    };
  }, [disableVirtualization]);
  useNavigationScrollRestorationAdapter(restorationAdapter);

  const virtualItems = virtualizer.getVirtualItems();
  const isVirtualScrolling = virtualizer.isScrolling;

  const handlePlay = useCallback(
    (track: SongDetail) => {
      const isCurrent = currentSongDetail?.id === track.id && isCurrentQueue;
      if (isCurrent) setIsPlaying(!isPlaying);
      else {
        const sourceId =
          playSourceId ?? (isDailyRecommendationPage ? dailyQueueId : (playlistID ?? null));
        void playFromSong(track, tracks, sourceId);
      }
    },
    [
      tracks,
      currentSongDetail,
      isPlaying,
      setIsPlaying,
      playFromSong,
      playSourceId,
      playlistID,
      isDailyRecommendationPage,
      dailyQueueId,
      isCurrentQueue,
    ],
  );

  const handleRequestDelete = useCallback(
    (playlistId: number | string | undefined, trackId: number) => {
      setPendingDelete({ playlistId, trackId });
    },
    [],
  );

  const setAlbumList = useUserStore((s) => s.setAlbumList);

  const updateVisibleTracks = useCallback(
    (nextTracks: SongDetail[]) => {
      if (onTracksChange) {
        onTracksChange(nextTracks);
        return;
      }
      setAlbumList(nextTracks);
    },
    [onTracksChange, setAlbumList],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (pendingDelete?.playlistId === undefined) return;
    try {
      await updatePlaylistTrack({
        operation: "del",
        playlistId: pendingDelete.playlistId,
        trackId: pendingDelete.trackId,
      });

      // 1. 乐观更新：立刻从视图移出
      updateVisibleTracks(tracks.filter((track) => track.id !== pendingDelete.trackId));
      toast.success(t("playlist.table.removeSuccess"));

      // 2. 触发全局刷新（这会告诉 Sidebar 在后台悄悄拉取最新歌单封面等元信息）
      const store = useUserStore.getState();
      if (store.triggerLibraryUpdate) store.triggerLibraryUpdate();
      void clearPageCache();
    } catch {
      toast.error(t("playlist.table.removeFailed"));
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete, t, tracks, updatePlaylistTrack, updateVisibleTracks]);

  const handleCancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const handleDislikeDailyRecommend = useCallback(
    async (trackId: number | string) => {
      try {
        const dislikeResult = await dislikeDailyRecommend(trackId);
        if (!dislikeResult.data) {
          throw new Error("The daily recommendation endpoint did not provide a replacement track.");
        }
        const replaceSong = pruneSongDetail(dislikeResult.data);

        const nextTracks = tracks.map((track) => (track.id === trackId ? replaceSong : track));

        updateVisibleTracks(nextTracks);
        void usePlayerStore.getState().playNext();
        void clearPageCache();

        toast.success(t("playlist.table.dislikeSuccess"));
      } catch (error) {
        reportActionFailure("playlist.daily_recommendation.dislike", error, { trackId });
        toast.error(t("playlist.table.operationFailed"));
      }
    },
    [dislikeDailyRecommend, t, tracks, updateVisibleTracks],
  );

  return (
    <>
      <ConfirmDialogShandCN
        open={!!pendingDelete}
        title={t("playlist.table.confirmDeleteTitle")}
        content={t("playlist.table.confirmDeleteContent")}
        confirmText={t("common.action.confirm")}
        cancelText={t("common.action.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <div className="w-full">
        <Table className="w-full table-fixed text-zinc-400">
          <TableHeader
            className={cn(
              "sticky top-0 z-10",
              isVirtualScrolling
                ? "shadow-none"
                : "drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)] backdrop-blur-sm",
              "bg-linear-to-b from-transparent to-[#121212]/10",
            )}
          >
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-10 text-center text-zinc-400 lg:w-12">#</TableHead>
              <TableHead
                className="group/head relative cursor-pointer text-zinc-400 transition-colors select-none hover:text-white"
                style={titleColumnStyle}
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1">
                  {t("playlist.table.columnTitle")}
                  {sortField === "title" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    ))}
                </div>
                {showExtendedColumns ? (
                  <ResizeHandle
                    onMouseDown={makeResizeHandler(
                      colTitleRef,
                      setColTitle,
                      colAlbumRef,
                      setColAlbum,
                      60,
                      64,
                    )}
                  />
                ) : (
                  <ResizeHandle
                    onMouseDown={
                      showAlbumColumn
                        ? makeMeasuredResizeHandler(
                            (_nextTitleWidth, nextAlbumWidth) =>
                              setCompactAlbumWidth(nextAlbumWidth),
                            COMPACT_TITLE_MIN,
                            COMPACT_ALBUM_MIN,
                          )
                        : makeMeasuredResizeHandler(
                            (_nextTitleWidth, nextDurationWidth) =>
                              setCompactDurationWidth(nextDurationWidth),
                            COMPACT_TITLE_MIN,
                            COMPACT_DURATION_MIN,
                          )
                    }
                  />
                )}
              </TableHead>
              {showAlbumColumn && (
                <TableHead
                  className="group/head relative cursor-pointer text-zinc-400 transition-colors select-none hover:text-white"
                  style={albumColumnStyle}
                  onClick={() => handleSort("album")}
                >
                  <div className="flex items-center gap-1">
                    {t("playlist.table.columnAlbum")}
                    {sortField === "album" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      ))}
                  </div>
                  {showExtendedColumns ? (
                    showDateColumn ? (
                      <ResizeHandle
                        onMouseDown={makeResizeHandler(
                          colAlbumRef,
                          setColAlbum,
                          colDateRef,
                          setColDate,
                          64,
                          120,
                        )}
                      />
                    ) : null
                  ) : (
                    <ResizeHandle
                      onMouseDown={makeMeasuredResizeHandler(
                        (nextAlbumWidth, nextDurationWidth) => {
                          setCompactAlbumWidth(nextAlbumWidth);
                          setCompactDurationWidth(nextDurationWidth);
                        },
                        COMPACT_ALBUM_MIN,
                        COMPACT_DURATION_MIN,
                      )}
                    />
                  )}
                </TableHead>
              )}
              {showDateColumn && (
                <TableHead
                  className="group/head relative cursor-pointer text-zinc-400 transition-colors select-none hover:text-white"
                  style={{ minWidth: 120, width: colDate }}
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    {t("playlist.table.columnPublished")}
                    {sortField === "date" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      ))}
                  </div>
                  {showLikeColumn && (
                    <ResizeHandle
                      onMouseDown={makeResizeHandler(
                        colDateRef,
                        setColDate,
                        colLikeRef,
                        setColLike,
                        120,
                        44,
                      )}
                    />
                  )}
                </TableHead>
              )}
              {showLikeColumn && (
                <TableHead
                  className="group/head relative cursor-pointer text-zinc-400 transition-colors select-none hover:text-white"
                  style={{ minWidth: 44, width: colLike }}
                  onClick={() => handleSort("like")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {t("playlist.table.columnLike")}
                    {sortField === "like" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      ))}
                  </div>
                </TableHead>
              )}
              <TableHead
                className="w-16 text-right text-zinc-400 lg:w-32"
                style={showExtendedColumns ? undefined : { width: compactDurationWidth }}
              >
                <div className="flex size-full items-center justify-end">
                  <Clock className="size-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedTracks.length === 0 ? (
              <TableRow className="border-none hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount} className="py-10 text-center text-zinc-500">
                  {hasSearchQuery ? (
                    t("playlist.table.searchNoResults", {
                      query: searchQuery ?? "",
                    })
                  ) : onEmptyAction && emptyActionLabel ? (
                    <div className="flex flex-col items-center gap-3">
                      <span>{t("playlist.table.noFetchedData")}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onEmptyAction}
                        className="bg-white text-black hover:bg-white/90"
                      >
                        <RefreshCw className="size-4" />
                        {emptyActionLabel}
                      </Button>
                    </div>
                  ) : (
                    <span>{t("playlist.table.noSongs")}</span>
                  )}
                </TableCell>
              </TableRow>
            ) : disableVirtualization ? (
              sortedTracks.map((track, index) => {
                const isActive = currentSongDetail?.id === track.id && isCurrentQueue;
                const isLiked = likeSet.has(track.id);
                return (
                  <SongContextMenu
                    key={`${track.id}-${index}`}
                    song={track}
                    isActive={isActive}
                    isPlaying={isPlaying}
                    onPlay={() => handlePlay(track)}
                    playlistID={playlistID}
                    isDailyRecommend={canDislikeDailyRecommendation}
                    readonly={readonly || isHistoricalDailyRecommendation}
                    onRemoveFromPlaylist={() =>
                      handleRequestDelete(playlistID ?? undefined, track.id)
                    }
                    onDislikeDailyRecommend={
                      canDislikeDailyRecommendation
                        ? () => void handleDislikeDailyRecommend(track.id)
                        : undefined
                    }
                  >
                    <TrackRow
                      track={track}
                      index={index}
                      isActive={isActive}
                      isPlaying={isPlaying}
                      isLiked={isLiked}
                      playlistID={playlistID}
                      onPlay={handlePlay}
                      onRequestDelete={handleRequestDelete}
                      setIsPlaying={setIsPlaying}
                      hideAlbumColumn={!showAlbumColumn}
                      durationColumnWidth={showExtendedColumns ? undefined : compactDurationWidth}
                      hideDateColumn={!showDateColumn}
                      hideLikeColumn={!showLikeColumn}
                    />
                  </SongContextMenu>
                );
              })
            ) : (
              <>
                {virtualItems.length > 0 && virtualItems[0].start > 0 && (
                  <tr style={{ height: `${virtualItems[0].start}px` }}>
                    <td colSpan={visibleColumnCount} aria-hidden />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const track = sortedTracks[virtualRow.index];
                  const isActive = currentSongDetail?.id === track.id && isCurrentQueue;
                  const isLiked = likeSet.has(track.id);
                  const row = (
                    <TrackRow
                      key={`${track.id}-${virtualRow.index}`}
                      ref={(element) => {
                        if (element) virtualRowElementsRef.current.set(virtualRow.index, element);
                        else virtualRowElementsRef.current.delete(virtualRow.index);
                      }}
                      data-index={virtualRow.index}
                      track={track}
                      index={virtualRow.index}
                      isActive={isActive}
                      isPlaying={isPlaying}
                      isLiked={isLiked}
                      playlistID={playlistID}
                      onPlay={handlePlay}
                      onRequestDelete={handleRequestDelete}
                      setIsPlaying={setIsPlaying}
                      hideAlbumColumn={!showAlbumColumn}
                      durationColumnWidth={showExtendedColumns ? undefined : compactDurationWidth}
                      hideDateColumn={!showDateColumn}
                      hideLikeColumn={!showLikeColumn}
                      isScrolling={isVirtualScrolling}
                    />
                  );

                  if (isVirtualScrolling) return row;

                  return (
                    <SongContextMenu
                      key={`${track.id}-${virtualRow.index}`}
                      song={track}
                      isActive={isActive}
                      isPlaying={isPlaying}
                      onPlay={() => handlePlay(track)}
                      playlistID={playlistID}
                      isDailyRecommend={canDislikeDailyRecommendation}
                      readonly={readonly || isHistoricalDailyRecommendation}
                      onRemoveFromPlaylist={() =>
                        handleRequestDelete(playlistID ?? undefined, track.id)
                      }
                      onDislikeDailyRecommend={
                        canDislikeDailyRecommendation
                          ? () => void handleDislikeDailyRecommend(track.id)
                          : undefined
                      }
                    >
                      {row}
                    </SongContextMenu>
                  );
                })}
                {virtualItems.length > 0 &&
                  (() => {
                    const last = virtualItems[virtualItems.length - 1];
                    const paddingBottom = virtualizer.getTotalSize() - last.end;
                    return paddingBottom > 0 ? (
                      <tr style={{ height: `${paddingBottom}px` }}>
                        <td colSpan={visibleColumnCount} aria-hidden />
                      </tr>
                    ) : null;
                  })()}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
function makeResizeHandler(
  leftRef: React.RefObject<number>,
  setLeft: (w: number) => void,
  rightRef: React.RefObject<number>,
  setRight: (w: number) => void,
  leftMin = MIN_COL,
  rightMin = MIN_COL,
) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startLeft = leftRef.current;
    const startRight = rightRef.current;
    const total = startLeft + startRight;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const nextLeft = Math.min(Math.max(leftMin, startLeft + delta), total - rightMin);
      setLeft(nextLeft);
      setRight(total - nextLeft);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
}

function makeMeasuredResizeHandler(
  onResize: (leftWidth: number, rightWidth: number) => void,
  leftMin = MIN_COL,
  rightMin = MIN_COL,
) {
  return (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const leftCell = e.currentTarget.parentElement;
    const rightCell = leftCell?.nextElementSibling;
    if (!(leftCell instanceof HTMLElement) || !(rightCell instanceof HTMLElement)) return;

    const startX = e.clientX;
    const startLeft = leftCell.getBoundingClientRect().width;
    const startRight = rightCell.getBoundingClientRect().width;
    const total = startLeft + startRight;

    const onMove = (event: MouseEvent) => {
      const delta = event.clientX - startX;
      const nextLeft = Math.min(Math.max(leftMin, startLeft + delta), total - rightMin);
      onResize(nextLeft, total - nextLeft);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
}

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <span
      onMouseDown={onMouseDown}
      className="absolute top-1/2 right-0 flex h-4 w-3 -translate-y-1/2 cursor-col-resize items-center justify-center opacity-0 transition-opacity select-none group-hover/head:opacity-100"
    >
      <GripVertical className="size-3 text-zinc-500" />
    </span>
  );
}
