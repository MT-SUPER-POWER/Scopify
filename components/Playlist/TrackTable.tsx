"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Ban,
  Clock,
  GripVertical,
  Heart,
  Link2,
  ListPlus,
  Pause,
  Play,
  PlusCircle,
  RefreshCw,
  Trash,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { FaRegCommentDots } from "react-icons/fa6";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dislikeDailyRecommend, likeSong } from "@/lib/api/playlist";
import { updatePlaylistTrack } from "@/lib/api/track";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { cn } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/api/music";
import type { NeteasePlaylist } from "@/types/api/playlist";
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

  const isLogin = useLoginStatus();
  const { t } = useI18n();
  const playlistID = useSearchParams().get("id");
  const isDailyRecommend = useSearchParams().get("isDailyRecommend") === "true";
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

  const [contextMenuTrack, setContextMenuTrack] = useState<SongDetail | null>(null);

  const playlists: NeteasePlaylist[] = useUserStore((state) => state.playlist);

  const filteredPlaylists = useMemo(
    () => playlists.filter((p: NeteasePlaylist) => String(p.id) !== String(playlistID)),
    [playlists, playlistID],
  );

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

  const isContextTrackCurrent = contextMenuTrack && currentSongDetail?.id === contextMenuTrack.id;
  const isContextTrackLiked = contextMenuTrack ? likeSet.has(contextMenuTrack.id) : false;
  const scrollContainer = useUiStore((s) => s.scrollContainer);

  const virtualizer = useVirtualizer({
    count: filteredTracks.length,
    getScrollElement: () => scrollContainer,
    estimateSize: () => 56,
    overscan: 15,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handlePlay = useCallback(
    (track: SongDetail) => {
      const isCurrent = currentSongDetail?.id === track.id;
      if (isCurrent) setIsPlaying(!isPlaying);
      else playFromSong(track, tracks, playlistID);
    },
    [tracks, currentSongDetail, isPlaying, setIsPlaying, playFromSong, playlistID],
  );

  const handlePlayContextTrack = useCallback(() => {
    if (!contextMenuTrack) return;
    handlePlay(contextMenuTrack);
  }, [contextMenuTrack, handlePlay]);

  const handleRequestDelete = useCallback((playlistId: string | number | undefined, trackId: number) => {
    setPendingDelete({ playlistId, trackId });
  }, []);

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
    } catch (_err) {
      toast.error(t("playlist.table.removeFailed"));
    } finally {
      setPendingDelete(null);
    }
  }, [albumList, pendingDelete, setAlbumList]);

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

        toast.success(t("playlist.table.dislikeSuccess"));
      } catch (err) {
        console.error("Failed to dislike daily recommend", err);
      }
    },
    [albumList, setAlbumList],
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

      <ContextMenu>
        <ContextMenuTrigger asChild>
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
                    className="text-zinc-400 relative group/head"
                    style={{ width: colTitle, minWidth: 60 }}
                  >
                    {t("playlist.table.columnTitle")}
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
                    className="hidden md:table-cell text-zinc-400 relative group/head"
                    style={{ width: colAlbum, minWidth: 64 }}
                  >
                    {t("playlist.table.columnAlbum")}
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
                      className="hidden lg:table-cell text-zinc-400 relative group/head"
                      style={{ width: colDate, minWidth: 120 }}
                    >
                      {t("playlist.table.columnPublished")}
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
                      className="hidden lg:table-cell text-zinc-400 text-center relative group/head"
                      style={{ width: colLike, minWidth: 44 }}
                    >
                      {t("playlist.table.columnLike")}
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
                {filteredTracks.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                      {hasSearchQuery ? (
                        <>{t("playlist.table.searchNoResults", { query: searchQuery ?? "" })}</>
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
                  filteredTracks.map((track, index) => {
                    const isActive = currentSongDetail?.id === track.id;
                    const isLiked = likeSet.has(track.id);
                    return (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        isActive={isActive}
                        isPlaying={isPlaying}
                        isLiked={isLiked}
                        playlistID={playlistID}
                        onPlay={handlePlay}
                        onRequestDelete={handleRequestDelete}
                        setIsPlaying={setIsPlaying}
                        onContextMenu={setContextMenuTrack}
                        hideDateColumn={hideDateColumn}
                        hideLikeColumn={hideLikeColumn}
                      />
                    );
                  })
                ) : (
                  <>
                    {virtualItems.length > 0 && virtualItems[0].start > 0 && (
                      <tr style={{ height: virtualItems[0].start }}>
                        <td />
                      </tr>
                    )}
                    {virtualItems.map((virtualRow) => {
                      const track = filteredTracks[virtualRow.index];
                      const isActive = currentSongDetail?.id === track.id;
                      const isLiked = likeSet.has(track.id);
                      return (
                        <TrackRow
                          key={track.id}
                          track={track}
                          index={virtualRow.index}
                          isActive={isActive}
                          isPlaying={isPlaying}
                          isLiked={isLiked}
                          playlistID={playlistID}
                          onPlay={handlePlay}
                          onRequestDelete={handleRequestDelete}
                          setIsPlaying={setIsPlaying}
                          onContextMenu={setContextMenuTrack}
                          hideDateColumn={hideDateColumn}
                          hideLikeColumn={hideLikeColumn}
                        />
                      );
                    })}
                    {virtualItems.length > 0 &&
                      (() => {
                        const last = virtualItems[virtualItems.length - 1];
                        const paddingBottom = virtualizer.getTotalSize() - last.end;
                        return paddingBottom > 0 ? (
                          <tr style={{ height: paddingBottom }}>
                            <td />
                          </tr>
                        ) : null;
                      })()}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </ContextMenuTrigger>

        {/* 上下文菜单 */}
        {contextMenuTrack && (
          <ContextMenuContent className="w-48 bg-[#282828] text-white border-white/10">
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={handlePlayContextTrack}
                className="focus:bg-white/10 focus:text-white"
              >
                {isContextTrackCurrent && isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    {t("contextMenu.pause")}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t("contextMenu.play")}
                  </>
                )}
              </ContextMenuItem>

              {isLogin && (
                <>
                  <ContextMenuItem
                    className="focus:bg-white/10 focus:text-white"
                    onClick={() => {
                      const state = usePlayerStore.getState();
                      const track = contextMenuTrack;
                      if (!track) return;
                      const alreadyInQueue = state.queue.some((t) => t.id === track.id);
                      if (alreadyInQueue) {
                        toast.info(t("playlist.table.queueExists"));
                        return;
                      }
                      state.setQueue([...state.queue, track], state.queueIndex);
                      toast.success(t("playlist.table.queueAdded"));
                    }}
                  >
                    <ListPlus className="w-4 h-4 mr-2" />
                    {t("contextMenu.addToQueue")}
                  </ContextMenuItem>

                  <ContextMenuItem
                    className="focus:bg-white/10 focus:text-white"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const nextLiked = !isContextTrackLiked;
                      const trackID = contextMenuTrack.id;
                      try {
                        await likeSong(trackID, nextLiked);

                        // 1. 本地状态更新
                        const store = useUserStore.getState() as any;
                        const currentLikes = Array.isArray(store.likeListIDs)
                          ? store.likeListIDs
                          : [];
                        if (nextLiked) store.setLikeListIDs([...currentLikes, trackID]);
                        else
                          store.setLikeListIDs(currentLikes.filter((id: number) => id !== trackID));
                        toast.success(
                          nextLiked
                            ? t("playlist.table.likedAdded")
                            : t("playlist.table.likedRemoved"),
                        );

                        // 2. 发送信号让 Sidebar 更新
                        if (store.triggerLibraryUpdate) store.triggerLibraryUpdate();
                      } catch (_err) {
                        toast.error(t("playlist.table.operationFailed"));
                      }
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {isContextTrackLiked
                      ? t("contextMenu.removeFromLiked")
                      : t("contextMenu.addToLiked")}
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuGroup>

            <ContextMenuSeparator className="bg-white/10" />

            <ContextMenuGroup>
              {isLogin && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                    <PlusCircle className="w-4 h-4 mr-4" />
                    {t("contextMenu.addToPlaylist")}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="bg-[#282828] text-white border-white/10">
                    {filteredPlaylists.map((playlist: NeteasePlaylist) => (
                      <ContextMenuItem
                        onClick={async () => {
                          try {
                            await updatePlaylistTrack("add", playlist.id, contextMenuTrack.id);
                            toast.success(t("playlist.table.addToPlaylistSuccess"));
                            // 添加同样可以触发全局刷新
                            const store = useUserStore.getState() as any;
                            if (store.triggerLibraryUpdate) store.triggerLibraryUpdate();
                          } catch (_err) {
                            toast.error(t("playlist.table.addToPlaylistFailed"));
                          }
                        }}
                        key={playlist.id}
                        className="focus:bg-white/10 focus:text-white"
                      >
                        <Image
                          width={28}
                          height={28}
                          src={playlist.coverImgUrl}
                          alt={t("playlist.form.coverAlt")}
                          className="w-7 h-7 rounded-sm mr-2"
                        />
                        {playlist.name}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}

              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <Link
                  href={contextMenuTrack.id ? `/comment/?songId=${contextMenuTrack.id}` : "#"}
                  className="w-full h-full block focus:bg-white/10 focus:text-white"
                >
                  <FaRegCommentDots className="w-4 h-4 mr-2" />
                  {t("contextMenu.comments")}
                </Link>
              </ContextMenuItem>

              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const href = `https://music.163.com/#/song?id=${contextMenuTrack.id}`;
                    navigator.clipboard
                      .writeText(href)
                      .then(() => toast.success(t("playlist.table.copySuccess")))
                      .catch(() => toast.error(t("playlist.table.copyFailed")));
                  }}
                  className="w-full h-full block focus:bg-white/10 focus:text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {t("contextMenu.copyLink")}
                </button>
              </ContextMenuItem>
            </ContextMenuGroup>

            {isLogin && !readonly && !isDailyRecommend && (
              <>
                <ContextMenuSeparator className="bg-white/10" />
                <ContextMenuGroup>
                  <ContextMenuItem
                    onClick={() => handleRequestDelete(playlistID ?? undefined, contextMenuTrack.id)}
                    variant="destructive"
                    className="focus:bg-red-500 focus:text-white"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    {t("contextMenu.removeFromPlaylist")}
                  </ContextMenuItem>
                </ContextMenuGroup>
              </>
            )}

            {isDailyRecommend && isLogin && (
              <>
                <ContextMenuSeparator className="bg-white/10" />
                <ContextMenuGroup>
                  <ContextMenuItem
                    onClick={() => handleDislikeDailyRecommend(contextMenuTrack.id)}
                    variant="destructive"
                    className="focus:bg-red-500 focus:text-white"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {t("contextMenu.recommendLess")}
                  </ContextMenuItem>
                </ContextMenuGroup>
              </>
            )}
          </ContextMenuContent>
        )}
      </ContextMenu>
    </>
  );
}
