"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronUp, Clock, RefreshCw } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { TracklistTableProps } from "@/types/components/playlist";

import {
  useNavigationScrollRestorationAdapter,
  usePrimaryScrollSurface,
} from "@/components/shared/NavigationScrollProvider";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { TracklistResizeHandle } from "@/components/shared/TracklistResizeHandle";
import { Button } from "@scopify/ui/shadcn/components/button";
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
import { useTracklistColumnLayout } from "@/hooks/playlist/useTracklistColumnLayout";
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

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function getRequiredTracklistColumn(table: TanstackTable<SongDetail>, columnId: string) {
  const column = table.getColumn(columnId);
  if (!column) throw new Error(`Missing required Tracklist column: ${columnId}`);
  return column;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TracklistTable({
  disableVirtualization = false,
  emptyActionLabel,
  hideAlbumColumn = false,
  hideDateColumn = false,
  hideLikeColumn = false,
  onEmptyAction,
  onTracksChange,
  dailyRecommendationMode,
  playSourceId,
  readonly = false,
  searchQuery,
  stickyHeaderClassName,
  stickyHeaderTop,
  tracks: externalTracks,
}: TracklistTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const showAlbumColumn = useMediaQuery("(min-width: 640px)") && !hideAlbumColumn;
  const showExtendedColumns = useMediaQuery("(min-width: 1024px)");
  const showDateColumn = showExtendedColumns && !hideDateColumn;
  const showLikeColumn = showExtendedColumns && !hideLikeColumn;
  const columnLayout = useTracklistColumnLayout({
    showAlbumColumn,
    showDateColumn,
    showLikeColumn,
  });

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

  const columns = useMemo<ColumnDef<SongDetail>[]>(
    () => [
      {
        id: "index",
        enableSorting: false,
      },
      { accessorFn: (track) => track.name, id: "title" },
      { accessorFn: (track) => track.al?.name ?? "", id: "album" },
      { accessorFn: (track) => track.publishTime ?? 0, id: "date" },
      {
        accessorFn: (track) => Number(likeSet.has(track.id)),
        id: "like",
      },
      {
        id: "duration",
        enableSorting: false,
      },
    ],
    [likeSet],
  );
  const table = useReactTable({
    columns,
    data: filteredTracks,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      columnVisibility: {
        album: showAlbumColumn,
        date: showDateColumn,
        like: showLikeColumn,
      },
      sorting,
    },
  });
  const sortedRows = table.getRowModel().rows;
  const sortedTracks = sortedRows.map((row) => row.original);
  const titleColumn = getRequiredTracklistColumn(table, "title");
  const albumColumn = getRequiredTracklistColumn(table, "album");
  const dateColumn = getRequiredTracklistColumn(table, "date");
  const likeColumn = getRequiredTracklistColumn(table, "like");
  const visibleColumnCount = columnLayout.visibleColumns.length;

  const primaryScrollSurface = usePrimaryScrollSurface();
  const stickyHeaderSentinelRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [isTableHeaderSticky, setIsTableHeaderSticky] = useState(false);
  const [tracklistScrollMargin, setTracklistScrollMargin] = useState(0);
  const virtualRowElementsRef = useRef(new Map<number, HTMLTableRowElement>());

  useEffect(() => {
    const sentinel = stickyHeaderSentinelRef.current;
    if (!primaryScrollSurface || !sentinel || stickyHeaderTop === undefined) {
      setIsTableHeaderSticky(false);
      return;
    }

    const syncStickyState = () => {
      const stickyTop = primaryScrollSurface.getBoundingClientRect().top + stickyHeaderTop;
      setIsTableHeaderSticky(sentinel.getBoundingClientRect().top <= stickyTop);
    };

    syncStickyState();
    primaryScrollSurface.addEventListener("scroll", syncStickyState, { passive: true });

    return () => primaryScrollSurface.removeEventListener("scroll", syncStickyState);
  }, [primaryScrollSurface, stickyHeaderTop]);

  useLayoutEffect(() => {
    const tableBody = tableBodyRef.current;
    if (disableVirtualization || !primaryScrollSurface || !tableBody) {
      setTracklistScrollMargin(0);
      return;
    }

    const measureScrollMargin = () => {
      const surfaceTop = primaryScrollSurface.getBoundingClientRect().top;
      const nextScrollMargin =
        tableBody.getBoundingClientRect().top - surfaceTop + primaryScrollSurface.scrollTop;

      setTracklistScrollMargin((current) =>
        Math.abs(current - nextScrollMargin) < 0.5 ? current : nextScrollMargin,
      );
    };

    measureScrollMargin();
    const resizeObserver = new ResizeObserver(measureScrollMargin);
    resizeObserver.observe(primaryScrollSurface);
    resizeObserver.observe(tableBody);
    window.addEventListener("resize", measureScrollMargin);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureScrollMargin);
    };
  }, [
    disableVirtualization,
    primaryScrollSurface,
    showAlbumColumn,
    showDateColumn,
    showLikeColumn,
  ]);

  const virtualizer = useVirtualizer({
    count: sortedTracks.length,
    enabled: !disableVirtualization,
    estimateSize: () => 56,
    getItemKey: (index) => sortedTracks[index]?.id ?? index,
    getScrollElement: () => primaryScrollSurface,
    isScrollingResetDelay: 160,
    overscan: 7,
    scrollMargin: tracklistScrollMargin,
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
  const virtualPaddingTop =
    virtualItems.length > 0 ? Math.max(0, virtualItems[0].start - tracklistScrollMargin) : 0;
  const lastVirtualItem = virtualItems[virtualItems.length - 1];
  const virtualPaddingBottom = lastVirtualItem
    ? Math.max(0, virtualizer.getTotalSize() - (lastVirtualItem.end - tracklistScrollMargin))
    : 0;

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

      <div className="w-full px-6 md:px-8 lg:px-10 xl:px-12">
        <div ref={stickyHeaderSentinelRef} aria-hidden className="-mb-px h-px" />
        <div ref={columnLayout.containerRef} className="-mx-4">
          <Table
            containerClassName="overflow-visible"
            className="w-full table-fixed text-content-muted"
            style={{ minWidth: columnLayout.minimumTableWidth }}
          >
            <colgroup>
              {columnLayout.visibleColumns.map((column) => (
                <col key={column} style={columnLayout.getColumnStyle(column)} />
              ))}
            </colgroup>
            <TableHeader
              style={stickyHeaderTop === undefined ? undefined : { top: stickyHeaderTop }}
              className={cn(
                "sticky top-0 z-10",
                "[&_[data-slot=table-head]]:h-9",
                isTableHeaderSticky
                  ? "bg-surface-raised/95 shadow-panel backdrop-blur-sm"
                  : "bg-transparent shadow-none",
                stickyHeaderClassName,
              )}
            >
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="pl-4 text-left text-content-muted">#</TableHead>
                <TableHead
                  className="group/head relative cursor-pointer text-content-muted transition-colors select-none hover:text-content"
                  onClick={titleColumn.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {t("playlist.table.columnTitle")}
                    {titleColumn.getIsSorted() &&
                      (titleColumn.getIsSorted() === "asc" ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      ))}
                  </div>
                  <TracklistResizeHandle
                    active={columnLayout.activeDivider === "title"}
                    onDoubleClick={(event) => columnLayout.resetResizePair("title", event)}
                    onPointerDown={(event) => columnLayout.startResize("title", event)}
                  />
                </TableHead>
                {showAlbumColumn && (
                  <TableHead
                    className="group/head relative cursor-pointer text-content-muted transition-colors select-none hover:text-content"
                    onClick={albumColumn.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {t("playlist.table.columnAlbum")}
                      {albumColumn.getIsSorted() &&
                        (albumColumn.getIsSorted() === "asc" ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        ))}
                    </div>
                    <TracklistResizeHandle
                      active={columnLayout.activeDivider === "album"}
                      onDoubleClick={(event) => columnLayout.resetResizePair("album", event)}
                      onPointerDown={(event) => columnLayout.startResize("album", event)}
                    />
                  </TableHead>
                )}
                {showDateColumn && (
                  <TableHead
                    className="group/head relative cursor-pointer px-3 text-xs font-normal text-content-muted transition-colors select-none hover:text-content"
                    onClick={dateColumn.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {t("playlist.table.columnPublished")}
                      {dateColumn.getIsSorted() &&
                        (dateColumn.getIsSorted() === "asc" ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        ))}
                    </div>
                    <TracklistResizeHandle
                      active={columnLayout.activeDivider === "date"}
                      onDoubleClick={(event) => columnLayout.resetResizePair("date", event)}
                      onPointerDown={(event) => columnLayout.startResize("date", event)}
                    />
                  </TableHead>
                )}
                {showLikeColumn && (
                  <TableHead
                    className="group/head relative cursor-pointer text-content-muted transition-colors select-none hover:text-content"
                    onClick={likeColumn.getToggleSortingHandler()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t("playlist.table.columnLike")}
                      {likeColumn.getIsSorted() &&
                        (likeColumn.getIsSorted() === "asc" ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        ))}
                    </div>
                    <TracklistResizeHandle
                      active={columnLayout.activeDivider === "like"}
                      onDoubleClick={(event) => columnLayout.resetResizePair("like", event)}
                      onPointerDown={(event) => columnLayout.startResize("like", event)}
                    />
                  </TableHead>
                )}
                <TableHead className="pr-4 text-right text-content-muted">
                  <div className="flex size-full items-center justify-end">
                    <Clock className="size-4" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody ref={tableBodyRef}>
              {sortedTracks.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell
                    colSpan={visibleColumnCount}
                    className="py-10 text-center text-content-subtle"
                  >
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
                          className="bg-brand text-brand-foreground hover:bg-brand-hover"
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
                        hideDateColumn={!showDateColumn}
                        hideLikeColumn={!showLikeColumn}
                      />
                    </SongContextMenu>
                  );
                })
              ) : (
                <>
                  {virtualPaddingTop > 0 && (
                    <tr style={{ height: `${virtualPaddingTop}px` }}>
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
                  {virtualPaddingBottom > 0 && (
                    <tr style={{ height: `${virtualPaddingBottom}px` }}>
                      <td colSpan={visibleColumnCount} aria-hidden />
                    </tr>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
