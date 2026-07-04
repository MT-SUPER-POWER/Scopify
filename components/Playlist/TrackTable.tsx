"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronUp, Clock, GripVertical, RefreshCw } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import { dislikeDailyRecommend } from "@/lib/api/playlist";
import { updatePlaylistTrack } from "@/lib/api/track";
import { clearPageCache } from "@/lib/cache/pageCache";
import { cn } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/api/music";
import { ConfirmDialogShandCN } from "./TableConfirmDialog";
import { TrackRow } from "./TrackRow";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COL RESIZE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MIN_COL = 60;

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

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <span
      onMouseDown={onMouseDown}
      className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-3 flex items-center justify-center cursor-col-resize opacity-0 group-hover/head:opacity-100 transition-opacity select-none"
    >
      <GripVertical className="w-3 h-3 text-zinc-500" />
    </span>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TracklistTableProps {
  searchOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;

  tracks?: SongDetail[];
  disableVirtualization?: boolean;
  hideDateColumn?: boolean;
  hideLikeColumn?: boolean;
  readonly?: boolean;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

type SortField = "title" | "album" | "date" | "like" | null;
type SortDirection = "asc" | "desc";

export default function TracklistTable({
  searchQuery,
  tracks: externalTracks,
  disableVirtualization = false,
  hideDateColumn = false,
  hideLikeColumn = false,
  readonly = false,
  emptyActionLabel,
  onEmptyAction,
}: TracklistTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [colTitle, setColTitleState] = useState(300);
  const [colAlbum, setColAlbumState] = useState(200);
  const [colDate, setColDateState] = useState(140);
  const [colLike, setColLikeState] = useState(80);
  const colTitleRef = useRef(300);
  const colAlbumRef = useRef(200);
  const colDateRef = useRef(140);
  const colLikeRef = useRef(80);
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
  const playlistID = useSearchParams().get("id");
  const isDailyRecommend = useSearchParams().get("isDailyRecommend") === "true";
  const pathname = usePathname();
  const storePlaylistId = usePlayerStore((s) => s.playlistId);

  const currentPageId = useMemo(() => {
    const isPlaylistOrAlbum = pathname.includes("/playlist") || pathname.includes("/album");
    if (!isPlaylistOrAlbum) return null;
    return playlistID ?? (isDailyRecommend ? "daily" : null);
  }, [pathname, playlistID, isDailyRecommend]);

  const isCurrentQueue = useMemo(() => {
    if (currentPageId === null) return true;
    return storePlaylistId === currentPageId;
  }, [currentPageId, storePlaylistId]);
  const [pendingDelete, setPendingDelete] = useState<null | {
    playlistId: number | string | undefined;
    trackId: number;
  }>(null);

  const storeTracks = useUserStore((state) => state.albumList);
  const tracks = externalTracks || storeTracks;
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

  const scrollContainer = useUiStore((s) => s.scrollContainer);

  const virtualizer = useVirtualizer({
    count: sortedTracks.length,
    getScrollElement: () => scrollContainer,
    estimateSize: () => 56,
    overscan: 15,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handlePlay = useCallback(
    (track: SongDetail) => {
      const isCurrent = currentSongDetail?.id === track.id && isCurrentQueue;
      if (isCurrent) setIsPlaying(!isPlaying);
      else {
        const playSourceId = isDailyRecommend ? "daily" : playlistID || null;
        playFromSong(track, tracks, playSourceId);
      }
    },
    [
      tracks,
      currentSongDetail,
      isPlaying,
      setIsPlaying,
      playFromSong,
      playlistID,
      isDailyRecommend,
      isCurrentQueue,
    ],
  );

  const handleRequestDelete = useCallback(
    (playlistId: string | number | undefined, trackId: number) => {
      setPendingDelete({ playlistId, trackId });
    },
    [],
  );

  const albumList = useUserStore((s) => s.albumList);
  const setAlbumList = useUserStore((s) => s.setAlbumList);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete || pendingDelete.playlistId === undefined) return;
    try {
      await updatePlaylistTrack("del", pendingDelete.playlistId, pendingDelete.trackId);

      // 1. 乐观更新：立刻从视图移出
      setAlbumList(albumList.filter((t) => t.id !== pendingDelete.trackId) as RawSongDetail[]);
      toast.success(t("playlist.table.removeSuccess"));

      // 2. 触发全局刷新（这会告诉 Sidebar 在后台悄悄拉取最新歌单封面等元信息）
      const store = useUserStore.getState();
      if (store.triggerLibraryUpdate) store.triggerLibraryUpdate();
      void clearPageCache();
    } catch (_err) {
      toast.error(t("playlist.table.removeFailed"));
    } finally {
      setPendingDelete(null);
    }
  }, [albumList, pendingDelete, setAlbumList, t]);

  const handleCancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const handleDislikeDailyRecommend = useCallback(
    async (trackId: number | string) => {
      try {
        const dislikeRes = await dislikeDailyRecommend(trackId);
        const replaceSong = pruneSongDetail(dislikeRes.data?.data) || null;

        const updateAlbumList = albumList.map((t) =>
          t.id === trackId ? replaceSong : t,
        ) as SongDetail[];

        setAlbumList(updateAlbumList);
        usePlayerStore.getState().playNext();
        void clearPageCache();

        toast.success(t("playlist.table.dislikeSuccess"));
      } catch (err) {
        console.error("Failed to dislike daily recommend", err);
      }
    },
    [albumList, setAlbumList, t],
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
        <Table className="w-full text-zinc-400 table-fixed">
          <TableHeader
            className={cn(
              "sticky top-0 z-10 backdrop-blur-sm drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)]",
              "bg-linear-to-b from-transparent to-[#121212]/10",
            )}
          >
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-12 text-center text-zinc-400">#</TableHead>
              <TableHead
                className="text-zinc-400 relative group/head hover:text-white cursor-pointer select-none transition-colors"
                style={{ width: colTitle, minWidth: 60 }}
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1">
                  {t("playlist.table.columnTitle")}
                  {sortField === "title" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    ))}
                </div>
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
              </TableHead>
              <TableHead
                className="hidden md:table-cell text-zinc-400 relative group/head hover:text-white cursor-pointer select-none transition-colors"
                style={{ width: colAlbum, minWidth: 64 }}
                onClick={() => handleSort("album")}
              >
                <div className="flex items-center gap-1">
                  {t("playlist.table.columnAlbum")}
                  {sortField === "album" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    ))}
                </div>
                {!hideDateColumn && (
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
                )}
              </TableHead>
              {!hideDateColumn && (
                <TableHead
                  className="hidden lg:table-cell text-zinc-400 relative group/head hover:text-white cursor-pointer select-none transition-colors"
                  style={{ width: colDate, minWidth: 120 }}
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    {t("playlist.table.columnPublished")}
                    {sortField === "date" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      ))}
                  </div>
                  {!hideLikeColumn && (
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
              {!hideLikeColumn && (
                <TableHead
                  className="hidden lg:table-cell text-zinc-400 relative group/head hover:text-white cursor-pointer select-none transition-colors"
                  style={{ width: colLike, minWidth: 44 }}
                  onClick={() => handleSort("like")}
                >
                  <div className="flex items-center gap-1 justify-center">
                    {t("playlist.table.columnLike")}
                    {sortField === "like" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      ))}
                  </div>
                </TableHead>
              )}
              <TableHead className="w-32 text-zinc-400">
                <div className="flex items-center w-full h-full justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedTracks.length === 0 ? (
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
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
                        <RefreshCw className="w-4 h-4" />
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
                    key={track.id}
                    song={track}
                    isActive={isActive}
                    isPlaying={isPlaying}
                    onPlay={() => handlePlay(track)}
                    playlistID={playlistID}
                    isDailyRecommend={isDailyRecommend}
                    readonly={readonly}
                    onRemoveFromPlaylist={() =>
                      handleRequestDelete(playlistID ?? undefined, track.id)
                    }
                    onDislikeDailyRecommend={() => handleDislikeDailyRecommend(track.id)}
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
                      hideDateColumn={hideDateColumn}
                      hideLikeColumn={hideLikeColumn}
                    />
                  </SongContextMenu>
                );
              })
            ) : (
              <>
                {virtualItems.length > 0 && virtualItems[0].start > 0 && (
                  <tr style={{ height: `${virtualItems[0].start}px` }}>
                    <td colSpan={6} aria-hidden />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const track = sortedTracks[virtualRow.index];
                  const isActive = currentSongDetail?.id === track.id && isCurrentQueue;
                  const isLiked = likeSet.has(track.id);
                  return (
                    <SongContextMenu
                      key={track.id}
                      song={track}
                      isActive={isActive}
                      isPlaying={isPlaying}
                      onPlay={() => handlePlay(track)}
                      playlistID={playlistID}
                      isDailyRecommend={isDailyRecommend}
                      readonly={readonly}
                      onRemoveFromPlaylist={() =>
                        handleRequestDelete(playlistID ?? undefined, track.id)
                      }
                      onDislikeDailyRecommend={() => handleDislikeDailyRecommend(track.id)}
                    >
                      <TrackRow
                        ref={virtualizer.measureElement}
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
                        hideDateColumn={hideDateColumn}
                        hideLikeColumn={hideLikeColumn}
                      />
                    </SongContextMenu>
                  );
                })}
                {virtualItems.length > 0 &&
                  (() => {
                    const last = virtualItems[virtualItems.length - 1];
                    const paddingBottom = virtualizer.getTotalSize() - last.end;
                    return paddingBottom > 0 ? (
                      <tr style={{ height: `${paddingBottom}px` }}>
                        <td colSpan={6} aria-hidden />
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
