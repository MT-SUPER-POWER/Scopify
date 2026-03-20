"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Play, Heart, Trash, PlusCircle, Pause, Link2, ListPlus, GripVertical } from "lucide-react";
import { LikeButton } from "@/components/ui/LikeButton";
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
} from "@/components/ui/context-menu"
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { likeSong } from "@/lib/api/playlist";
import { toast } from "sonner";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { updatePlaylistTrack } from "@/lib/api/track";
import { useSearchParams } from "next/navigation";
import { NeteasePlaylist } from "@/types/api/playlist";
import Link from "next/link";
import { FaRegCommentDots } from "react-icons/fa6";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "motion/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useUiStore } from "@/store/module/ui";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConfirmDialogShandCN({
  open, title, content, onConfirm, onCancel,
  confirmText = "确认", cancelText = "取消"
}: {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogOverlay className="bg-black/60 backdrop-blur-sm" />

      <AlertDialogContent className={cn(
        "bg-[#282828] border-none shadow-2xl rounded-xl w-96 p-8",
        "flex flex-col",
      )}>
        {/* text-center 覆盖 shadcn AlertDialogHeader 默认的 text-left */}
        <AlertDialogHeader className="space-y-2 mb-8 w-full">
          <AlertDialogTitle className="w-full text-2xl font-bold text-white tracking-tight text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#b3b3b3] text-sm">
            {content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* sm:flex-col 覆盖 shadcn Footer 默认在宽屏变 flex-row 的行为 */}
        <AlertDialogFooter className="flex flex-col gap-4 w-full sm:flex-col">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-base transition-all"
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3.5 rounded-full bg-transparent border border-[#727272] hover:border-white text-white font-bold text-base transition-all"
          >
            {cancelText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// FIX: ConfirmDialog 提升到列表层，TrackRowContextMenu 只接收回调，不再自己挂载 Dialog
// (Deleted TrackRowContextMenu and moved logic to TracklistTable)

function TrackIndexCell({ index, isActive, isPlaying, onPlay, setIsPlaying }: {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  setIsPlaying: (v: boolean) => void;
}) {
  return (
    <div className="relative w-4 h-4 mx-auto flex items-center justify-center">
      <span className={cn(
        "text-zinc-400 font-normal group-hover:hidden",
        isActive && "hidden"
      )}>
        {index + 1}
      </span>

      {/* 频谱：只在 isActive && isPlaying 时显示，hover 时隐藏 */}
      {isActive && isPlaying && (
        <div className="flex items-end gap-0.5 h-3 shrink-0 group-hover:hidden">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-[#1ed760] rounded-full"
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
              style={{ height: "100%", originY: 1 }}
            />
          ))}
        </div>
      )}

      {/* 暂停图标：isActive && 未播放时显示，hover 时隐藏 */}
      {isActive && !isPlaying && (
        <Play className="w-4 h-4 text-[#1ed760] fill-current group-hover:hidden" />
      )}

      {/* hover 时覆盖显示 */}
      <div className="hidden group-hover:flex items-center justify-center">
        {isActive && isPlaying ? (
          <Pause
            className="w-4 h-4 text-[#1ed760] fill-current cursor-pointer"
            onClick={() => setIsPlaying(false)}
          />
        ) : (
          <Play
            className="w-4 h-4 text-white fill-current cursor-pointer"
            onClick={onPlay}
          />
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TRACK ROW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 只有 isActive / isPlaying / isLiked / index 三个状态变化时才重渲染该行，其余行完全跳过
interface TrackRowProps {
  track: any;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  playlistID: string | null;
  onPlay: () => void;
  onRequestDelete: (playlistId: number | string, trackId: number) => void;
  setIsPlaying: (v: boolean) => void;
  onContextMenu: (track: any) => void;
}

const TrackRow = memo(function TrackRow({
  track,
  index,
  isActive,
  isPlaying,
  isLiked,
  onPlay,
  setIsPlaying,
  onContextMenu,
}: TrackRowProps) {
  return (
    <TableRow
      className={cn(
        "group hover:bg-white/10 border-none transition-colors cursor-default",
        isActive && "text-[#1ed760]"
      )}
      onDoubleClick={onPlay}
      onContextMenu={() => onContextMenu(track)}
    >
      {/* 索引 */}
      <TableCell className="text-center font-medium rounded-l-md">
        <TrackIndexCell
          index={index}
          isActive={isActive}
          isPlaying={isPlaying}
          onPlay={onPlay}
          setIsPlaying={setIsPlaying}
        />
      </TableCell>

      {/* 歌曲名称 */}
      <TableCell className="min-w-0 max-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-zinc-800 rounded">
            <img src={track.al.picUrl} alt={track.al.name} loading="lazy" className="w-full h-full object-cover rounded" />
          </div>
          <div className="flex flex-col truncate">
            <span
              title={track.name}
              className={cn(
                "text-base font-normal truncate group-hover:underline cursor-pointer",
                isActive ? "text-[#1ed760]" : "text-white"
              )}
            >
              {track.name}
            </span>
            <span
              title={track.ar.map((artist: any) => artist.name).join(", ")}
              className="text-zinc-400 text-sm hover:text-white hover:underline cursor-pointer truncate"
            >
              {track.ar.map((artist: any) => artist.name).join(", ")}
            </span>
          </div>
        </div>
      </TableCell>

      {/* 专辑名称 */}
      <TableCell className="hidden md:table-cell max-w-0">
        <span title={track.al.name} className="hover:text-white hover:underline cursor-pointer block truncate">
          {track.al.name}
        </span>
      </TableCell>

      {/* 发布日期 */}
      <TableCell className="hidden lg:table-cell truncate">
        <span title={formatDate(track.publishTime)}>{formatDate(track.publishTime)}</span>
      </TableCell>

      {/* 喜欢 */}
      <TableCell className="hidden lg:table-cell truncate w-20">
        <div className="w-full h-full flex justify-center">
          <LikeButton
            liked={isLiked}
            likedCount={track.popularity || 0}
            onLike={() => {
              const nextLiked = !isLiked;
              likeSong(track.id, nextLiked)
                .then(() => {
                  const store = useUserStore.getState();
                  const currentLikes = Array.isArray(store.likeListIDs) ? store.likeListIDs : [];
                  if (nextLiked) {
                    store.setLikeListIDs([...currentLikes, track.id]);
                  } else {
                    const newLikeIDs = currentLikes.filter((id: number) => id !== track.id);
                    store.setLikeListIDs(newLikeIDs);

                    // 只有当前歌单是「喜欢的歌曲」歌单时才需要移除该曲目
                    const newLikeSet = new Set(newLikeIDs);
                    const isLikePlaylist = store.albumList.every(
                      (t: any) => newLikeSet.has(t.id) || t.id === track.id
                    );
                    if (isLikePlaylist) {
                      store.setAlbumList(store.albumList.filter((t: any) => t.id !== track.id));
                    }
                  }
                  toast.success(nextLiked ? "已添加到喜欢" : "已取消喜欢");
                })
                .catch((err) => {
                  console.error("Failed to update like status:", err);
                  toast.error("操作失败，请稍后再试");
                });
            }}
            iconClassName="w-4.5 h-4.5"
          />
        </div>
      </TableCell>

      {/* 播放所需时间 */}
      <TableCell className="w-32 rounded-r-md align-middle">
        <div className="flex justify-center items-center">
          <span title={formatDuration(track.dt)}>{formatDuration(track.dt)}</span>
        </div>
      </TableCell>

    </TableRow>
  );
}, (prev, next) =>
  // 精致 compare，确保 isLiked 变化时能重渲染
  prev.isActive === next.isActive &&
  prev.isPlaying === next.isPlaying &&
  prev.isLiked === next.isLiked &&
  prev.index === next.index
);

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

export default function TracklistTable({ searchQuery }: {
  searchOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [colTitle, setColTitleState] = useState(300);
  const [colAlbum, setColAlbumState] = useState(200);
  const [colDate, setColDateState] = useState(140);
  const [colLike, setColLikeState] = useState(80);
  const colTitleRef = useRef(300);
  const colAlbumRef = useRef(200);
  const colDateRef = useRef(140);
  const colLikeRef = useRef(80);
  const setColTitle = (w: number) => { colTitleRef.current = w; setColTitleState(w); };
  const setColAlbum = (w: number) => { colAlbumRef.current = w; setColAlbumState(w); };
  const setColDate = (w: number) => { colDateRef.current = w; setColDateState(w); };
  const setColLike = (w: number) => { colLikeRef.current = w; setColLikeState(w); };
  const tracks = useUserStore((state: any) => state.albumList);
  const likelist = useUserStore((s) => s.likeListIDs);

  // FIX: actions 通过 hook 获取，而非 getState()
  const setQueue = usePlayerStore((s: any) => s.setQueue);
  const playQueueIndex = usePlayerStore((s: any) => s.playQueueIndex);
  const setIsPlaying = usePlayerStore((s: any) => s.setIsPlaying);
  const currentSongDetail = usePlayerStore((s: any) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s: any) => s.isPlaying);

  const playlistID = useSearchParams().get("id");

  // FIX: ConfirmDialog 提升到列表层，只挂一个实例，不再每行各挂一个
  const [pendingDelete, setPendingDelete] = useState<null | { playlistId: number | string; trackId: number }>(null);

  // Context Menu State
  const [contextMenuTrack, setContextMenuTrack] = useState<any | null>(null);

  // --- Logic for Context Menu ---
  const isLoggedIn = useLoginStatus();
  const playlists: NeteasePlaylist[] = useUserStore((state: any) => state.playlist);

  // Filter out current playlist for "Add to playlist"
  const filteredPlaylists = useMemo(
    () => playlists.filter((p: NeteasePlaylist) => String(p.id) !== String(playlistID)),
    [playlists, playlistID]
  );

  // FIX: likeSet 用 Set 替代数组，.has() 是 O(1)，避免每行 O(n) 的 includes 查找
  const likeSet = useMemo(() => {
    if (Array.isArray(likelist)) {
      return new Set(likelist);
    }
    return new Set<number>();
  }, [likelist]);

  // 搜索功能：如果 searchQuery 为空，则直接返回原始 tracks，避免不必要的 filter 运算；否则进行过滤。
  const filteredTracks = useMemo(() => {
    if (!searchQuery?.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter((track: any) =>
      (track.name?.toLowerCase?.() || "").includes(q) ||
      (Array.isArray(track.ar) && track.ar.some((a: any) => (a?.name?.toLowerCase?.() || "").includes(q))) ||
      (track.al?.name?.toLowerCase?.() || "").includes(q)
    );
  }, [tracks, searchQuery]);

  const scrollContainer = useUiStore((s) => s.scrollContainer);

  // OPTIMIZE: 虚拟列表优化页面
  const virtualizer = useVirtualizer({
    count: filteredTracks.length,
    getScrollElement: () => scrollContainer,      // 拿到全部绑定的 ScrollArea 元素
    estimateSize: () => 56,
    overscan: 10,       // DEBUG: 虚拟列表上下缓冲控制区域
  });

  const virtualItems = virtualizer.getVirtualItems();

  // FIX: useCallback 稳定引用，避免每次 TracklistTable render 时 TrackRow 收到新函数引用导致 memo 失效
  const handlePlay = useCallback((index: number) => {
    const track = filteredTracks[index];
    const originalIndex = tracks.findIndex((t: any) => t.id === track.id);
    const isCurrent = currentSongDetail?.id === track.id;
    if (isCurrent) {
      setIsPlaying(!isPlaying);
    } else {
      setQueue(tracks, originalIndex);
      playQueueIndex(originalIndex);
    }
  }, [filteredTracks, tracks, currentSongDetail, isPlaying, setIsPlaying, setQueue, playQueueIndex]);

  // Helper for playing context menu track
  const handlePlayContextTrack = useCallback(() => {
    if (!contextMenuTrack) return;
    const index = filteredTracks.findIndex((t: any) => t.id === contextMenuTrack.id);
    if (index !== -1) {
      handlePlay(index);
    } else {
      // Fallback if not in current view (unlikely)
      handlePlay(tracks.findIndex((t: any) => t.id === contextMenuTrack.id));
    }
  }, [contextMenuTrack, filteredTracks, handlePlay, tracks]);

  const handleRequestDelete = useCallback((playlistId: number | string, trackId: number) => {
    setPendingDelete({ playlistId, trackId });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await updatePlaylistTrack("del", pendingDelete.playlistId, pendingDelete.trackId);
      const store = useUserStore.getState();
      store.setAlbumList(
        store.albumList.filter((t: any) => t.id !== pendingDelete.trackId)
      );
      toast.success("已从歌单移除");
    } catch (err) {
      toast.error("从歌单移除失败");
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete]);

  const handleCancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  // Derived state for Context Menu
  const isContextTrackCurrent = contextMenuTrack && currentSongDetail?.id === contextMenuTrack.id;
  const isContextTrackLiked = contextMenuTrack ? likeSet.has(contextMenuTrack.id) : false;

  return (
    <>
      {/* FIX: 整个列表只挂一个 ConfirmDialog，而非每行各一个 */}
      <ConfirmDialogShandCN
        open={!!pendingDelete}
        title="确认移除"
        content="确定要将此歌曲从歌单移除吗？此操作不可撤销。"
        confirmText="确认移除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="w-full">
            <Table className="w-full text-zinc-400 table-fixed">
              {/* 表头 */}
              <TableHeader className={cn(
                "sticky top-0 z-10 backdrop-blur-sm drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)]",
                "bg-linear-to-b from-transparent to-[#121212]/10"
              )}>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-12 text-center text-zinc-400">#</TableHead>
                  <TableHead className="text-zinc-400 relative group/head" style={{ width: colTitle, minWidth: 60 }}>
                    Title
                    <ResizeHandle onMouseDown={makeResizeHandler(colTitleRef, setColTitle, colAlbumRef, setColAlbum, 60, 64)} />
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-zinc-400 relative group/head" style={{ width: colAlbum, minWidth: 64 }}>
                    Album
                    <ResizeHandle onMouseDown={makeResizeHandler(colAlbumRef, setColAlbum, colDateRef, setColDate, 64, 120)} />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-zinc-400 relative group/head" style={{ width: colDate, minWidth: 120 }}>
                    Date Published
                    <ResizeHandle onMouseDown={makeResizeHandler(colDateRef, setColDate, colLikeRef, setColLike, 120, 44)} />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-zinc-400 text-center relative group/head" style={{ width: colLike, minWidth: 44 }}>
                    Like
                  </TableHead>
                  <TableHead className="w-32 text-zinc-400">
                    <div className="flex items-center w-full h-full justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              {/* 表身 */}
              <TableBody>
                {filteredTracks.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={6} className="text-center text-zinc-500 py-10">
                      没有找到 &ldquo;{searchQuery}&rdquo; 相关的歌曲
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* 顶部占位 */}
                    {virtualItems.length > 0 && virtualItems[0].start > 0 && (
                      <tr style={{ height: virtualItems[0].start }}><td /></tr>
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
                          onPlay={() => handlePlay(virtualRow.index)}
                          onRequestDelete={handleRequestDelete}
                          setIsPlaying={setIsPlaying}
                          onContextMenu={setContextMenuTrack}
                        />
                      );
                    })}

                    {/* 底部占位 */}
                    {virtualItems.length > 0 && (() => {
                      const last = virtualItems[virtualItems.length - 1];
                      const paddingBottom = virtualizer.getTotalSize() - last.end;
                      return paddingBottom > 0 ? <tr style={{ height: paddingBottom }}><td /></tr> : null;
                    })()}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </ContextMenuTrigger>

        {contextMenuTrack && (
          <ContextMenuContent className="w-48 bg-[#282828] text-white border-white/10">

            <ContextMenuGroup>

              {/* 播放/暂停 */}
              <ContextMenuItem onClick={handlePlayContextTrack} className="focus:bg-white/10 focus:text-white">
                {isContextTrackCurrent && isPlaying ? (
                  <><Pause className="w-4 h-4 mr-2" />Pause</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" />Play</>
                )}
              </ContextMenuItem>

              {/* 添加到队列 */}
              <ContextMenuItem
                className="focus:bg-white/10 focus:text-white"
                onClick={() => {
                  const state = usePlayerStore.getState();
                  const track = contextMenuTrack;
                  if (!track) return;
                  const alreadyInQueue = state.queue.some((t) => t.id === track.id);
                  if (alreadyInQueue) {
                    toast.info("歌曲已在队列中");
                    return;
                  }
                  state.setQueue([...state.queue, track], state.queueIndex);
                  toast.success("已添加到播放队列");
                }}
              >
                <ListPlus className="w-4 h-4 mr-2" />
                Add to queue
              </ContextMenuItem>

              {/* 歌曲喜欢或者不喜欢处理 */}
              <ContextMenuItem
                className="focus:bg-white/10 focus:text-white"
                onClick={async (e) => {
                  e.stopPropagation();
                  // Optimistic update logic
                  const nextLiked = !isContextTrackLiked;
                  const trackID = contextMenuTrack.id;
                  try {
                    await likeSong(trackID, nextLiked);
                    const store = useUserStore.getState();
                    const currentLikes = Array.isArray(store.likeListIDs) ? store.likeListIDs : [];
                    if (nextLiked) {
                      store.setLikeListIDs([...currentLikes, trackID]);
                    } else {
                      store.setLikeListIDs(currentLikes.filter((id: number) => id !== trackID));
                    }
                    toast.success(nextLiked ? "已添加到喜欢" : "已取消喜欢");
                  } catch (err) {
                    toast.error("操作失败，请稍后再试");
                  }
                }}
              >
                <Heart className="w-4 h-4 mr-2" />
                {isContextTrackLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
              </ContextMenuItem>

            </ContextMenuGroup>

            <ContextMenuSeparator className="bg-white/10" />

            <ContextMenuGroup>

              {/* 添加到歌单 */}
              <ContextMenuSub>
                <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                  <PlusCircle className="w-4 h-4 mr-4" />
                  Add to Playlist
                </ContextMenuSubTrigger>

                <ContextMenuSubContent className="bg-[#282828] text-white border-white/10">
                  {isLoggedIn && filteredPlaylists.map((playlist: NeteasePlaylist) => (
                    <ContextMenuItem
                      onClick={async () => {
                        try {
                          await updatePlaylistTrack("add", playlist.id, contextMenuTrack.id);
                          toast.success("已成功添加到歌单");
                        } catch (err) {
                          toast.error("添加到歌单失败");
                        }
                      }}
                      key={playlist.id} className="focus:bg-white/10 focus:text-white"
                    >
                      <img src={playlist.coverImgUrl} alt="cover" className="w-7 h-7 rounded-sm mr-2" />
                      {playlist.name}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>

              {/* 去评论区 */}
              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <Link
                  href={contextMenuTrack.id ? `/comment/?songId=${contextMenuTrack.id}` : "#"}
                  onClick={(e) => !contextMenuTrack.id && e.preventDefault()}
                  className="w-full h-full block focus:bg-white/10 focus:text-white">
                  <FaRegCommentDots className="w-4 h-4 mr-2" />
                  Comments
                </Link>
              </ContextMenuItem>

              {/* 复制连接 */}
              <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
                <button
                  onClick={() => {
                    const href = `https://music.163.com/#/song?id=${contextMenuTrack.id}`;
                    navigator.clipboard.writeText(href)
                      .then(() => {
                        toast.success("链接已复制到剪贴板");
                      })
                      .catch(() => {
                        toast.error("复制链接失败");
                      });
                  }}
                  className="w-full h-full block focus:bg-white/10 focus:text-white">
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Link
                </button>
              </ContextMenuItem>

            </ContextMenuGroup>

            <ContextMenuSeparator className="bg-white/10" />

            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() => handleRequestDelete(playlistID!, contextMenuTrack.id)}
                variant="destructive" className="focus:bg-red-500 focus:text-white">
                <Trash className="w-4 h-4 mr-2" />
                Remove from current playlist
              </ContextMenuItem>
            </ContextMenuGroup>

          </ContextMenuContent>
        )}
      </ContextMenu>
    </>
  );
}
