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
import { Clock, Play, Heart, Trash, PlusCircle, Pause, Link2 } from "lucide-react";
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
import { memo, useCallback, useMemo, useState } from "react";
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
      {/* BUG: 这个遮罩层，因为和 table 出现在一起，然后会有一个报错
          后期遮罩层移动到高一点解决吧，如果打包没错，就临时用
    */}
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
function TrackRowContextMenu({ children, trackID, onPlay, currentPlaylistId, onRequestDelete }: {
  children: React.ReactNode;
  trackID: number;
  onPlay: () => void;
  currentPlaylistId?: number | string;
  // FIX: 删除确认由父层统一处理，这里只触发回调
  onRequestDelete: (playlistId: number | string, trackId: number) => void;
}) {
  // FIX: Hook 全部在组件顶层调用，不再嵌套在 JSX 表达式里
  const isLoggedIn = useLoginStatus();

  const playlists: NeteasePlaylist[] = useUserStore((state: any) => state.playlist);
  // FIX: 用 usePlayerStore hook 订阅，而非 getState() 快照，确保菜单状态实时准确
  const isCurrent = usePlayerStore((s: any) => s.currentSongDetail?.id === trackID);
  const isPlaying = usePlayerStore((s: any) => s.isPlaying);
  // FIX: likeListIDs 也通过 hook 订阅，保证菜单文案实时同步
  const rawLikelist = useUserStore((s) => s.likeListIDs);
  const isLiked = Array.isArray(rawLikelist) ? rawLikelist.includes(trackID) : false;

  // 过滤掉当前歌单
  const filteredPlaylists = useMemo(
    () => playlists.filter((p: NeteasePlaylist) => String(p.id) !== String(currentPlaylistId)),
    [playlists, currentPlaylistId]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-[#282828] text-white border-white/10">

        <ContextMenuGroup>

          {/* FIX: 播放/暂停改用订阅状态，实时准确 */}
          <ContextMenuItem onClick={onPlay} className="focus:bg-white/10 focus:text-white">
            {isCurrent && isPlaying ? (
              <><Pause className="w-4 h-4 mr-2" />Pause</>
            ) : (
              <><Play className="w-4 h-4 mr-2" />Play</>
            )}
          </ContextMenuItem>

          {/* 歌曲喜欢或者不喜欢处理 */}
          <ContextMenuItem
            className="focus:bg-white/10 focus:text-white"
            onClick={async (e) => {
              e.stopPropagation();
              const nextLiked = !isLiked;
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
            {/* FIX: 改用订阅状态，而非 getState() */}
            {isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
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
              {/* FIX: useLoginStatus() 已提到顶层，这里直接用变量 */}
              {isLoggedIn && filteredPlaylists.map((playlist: NeteasePlaylist) => (
                <ContextMenuItem
                  onClick={async () => {
                    try {
                      await updatePlaylistTrack("add", playlist.id, trackID);
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
              href={trackID ? `/comment/?songId=${trackID}` : "#"}
              onClick={(e) => !trackID && e.preventDefault()}
              className="w-full h-full block focus:bg-white/10 focus:text-white">
              <FaRegCommentDots className="w-4 h-4 mr-2" />
              Comments
            </Link>
          </ContextMenuItem>

          {/* 复制连接 */}
          <ContextMenuItem asChild className="w-40 bg-[#282828] text-white border-white/10">
            <button
              onClick={() => {
                const href = `https://music.163.com/#/song?id=${trackID}`;
                // NOTE: electron 调用剪贴板
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
            onClick={() => onRequestDelete(currentPlaylistId!, trackID)}
            variant="destructive" className="focus:bg-red-500 focus:text-white">
            <Trash className="w-4 h-4 mr-2" />
            Remove from current playlist
          </ContextMenuItem>
        </ContextMenuGroup>

      </ContextMenuContent>
    </ContextMenu>
  );
}

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
}

const TrackRow = memo(function TrackRow({
  track,
  index,
  isActive,
  isPlaying,
  isLiked,
  playlistID,
  onPlay,
  onRequestDelete,
  setIsPlaying,
}: TrackRowProps) {
  return (
    <TrackRowContextMenu
      trackID={track.id}
      onPlay={onPlay}
      currentPlaylistId={playlistID!}
      onRequestDelete={onRequestDelete}
    >
      <TableRow
        className={cn(
          "group hover:bg-white/10 border-none transition-colors cursor-default",
          isActive && "text-[#1ed760]"
        )}
        onDoubleClick={onPlay}
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
        <TableCell>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 bg-zinc-800 rounded">
              <img src={track.al.picUrl} alt={track.al.name} className="w-full h-full object-cover rounded" />
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
        <TableCell className="hidden md:table-cell truncate">
          <span title={track.al.name} className="hover:text-white hover:underline cursor-pointer">
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
    </TrackRowContextMenu>
  );
}, (prev, next) =>
  // 精致 compare，确保 isLiked 变化时能重渲染
  prev.isActive === next.isActive &&
  prev.isPlaying === next.isPlaying &&
  prev.isLiked === next.isLiked &&
  prev.index === next.index
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TracklistTable({ searchQuery }: {
  searchOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
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

      <Table className="w-full text-zinc-400 table-fixed">
        {/* 表头 */}
        <TableHeader className={cn(
          "sticky top-0 z-10 backdrop-blur-sm drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)]",
          "bg-linear-to-b from-transparent to-[#121212]/10"
        )}>
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-12 text-center text-zinc-400">#</TableHead>
            <TableHead className="text-zinc-400">Title</TableHead>
            <TableHead className="hidden md:table-cell text-zinc-400">Album</TableHead>
            <TableHead className="hidden lg:table-cell text-zinc-400">Date Published</TableHead>
            <TableHead className="hidden lg:table-cell text-zinc-400 text-center w-20">Like</TableHead>
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
            filteredTracks.map((track: any, index: number) => {
              const isActive = currentSongDetail?.id === track.id;
              // FIXME: O(1) Set 查找替代 O(n) includes
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
                  onPlay={() => handlePlay(index)}
                  onRequestDelete={handleRequestDelete}
                  setIsPlaying={setIsPlaying}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </>
  );
}
