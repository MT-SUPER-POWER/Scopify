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
import { Clock, Play, Heart, Trash, PlusCircle, Pause } from "lucide-react";
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
import { useMemo, useState } from "react";
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


function ConfirmDialogShandCN({ open, title, content, onConfirm, onCancel,
  confirmText = "确认", cancelText = "取消" }: {
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
    {/*
      BUG: 这个遮罩层，因为和 table 出现在一起，然后会有一个报错
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

function TrackRowContextMenu({ children, trackID, onPlay, currentPlaylistId }: {
  children: React.ReactNode,
  trackID: number,
  onPlay: () => void
  currentPlaylistId?: number | string;
}) {

  const playlists: NeteasePlaylist[] = useUserStore((state: any) => state.playlist);
  // 过滤掉当前歌单
  const filteredPlaylists = playlists.filter(
    (p: NeteasePlaylist) => String(p.id) !== currentPlaylistId
  );

  // 删除确认模态控制
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<null | { playlistId: number | string, trackId: number }>(null);

  return (
    <>
      {/* 删除确认模态对话框 */}
      <ConfirmDialogShandCN
        open={confirmDialogOpen}
        title="确认移除"
        content="确定要将此歌曲从歌单移除吗？此操作不可撤销。"
        confirmText="确认移除"
        cancelText="取消"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await updatePlaylistTrack("del", pendingDelete.playlistId, pendingDelete.trackId);
            // 同步更新本地 store，UI 立即响应
            const store = useUserStore.getState();
            store.setAlbumList(
              store.albumList.filter((t: any) => t.id !== pendingDelete.trackId)
            );
            toast.success("已从歌单移除");
          } catch (err) {
            toast.error("从歌单移除失败");
          } finally {
            setConfirmDialogOpen(false);
            setPendingDelete(null);
          }
        }}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setPendingDelete(null);
        }}
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 bg-[#282828] text-white border-white/10">

          <ContextMenuGroup>

            {/* 播放或暂停歌曲 */}
            {usePlayerStore.getState().isPlaying ? (
              <ContextMenuItem onClick={onPlay} className="focus:bg-white/10 focus:text-white">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </ContextMenuItem>
            ) : (
              <ContextMenuItem onClick={onPlay} className="focus:bg-white/10 focus:text-white">
                <Play className="w-4 h-4 mr-2" />
                Play
              </ContextMenuItem>
            )}

            {/* 歌曲喜欢或者不喜欢处理 */}
            <ContextMenuItem
              className="focus:bg-white/10 focus:text-white"
              onClick={async (e) => {
                e.stopPropagation();
                const store = useUserStore.getState();
                const isLiked = store.likeListIDs.includes(trackID);
                const nextLiked = !isLiked;
                try {
                  await likeSong(trackID, nextLiked);
                  if (nextLiked) {
                    store.setLikeListIDs([...store.likeListIDs, trackID]);
                  } else {
                    store.setLikeListIDs(store.likeListIDs.filter((id) => id !== trackID));
                  }
                  toast.success(nextLiked ? "已添加到喜欢" : "已取消喜欢");
                } catch (err) {
                  toast.error("操作失败，请稍后再试");
                }
              }}
            >
              <Heart className="w-4 h-4 mr-2" />
              {useUserStore.getState().likeListIDs.includes(trackID) ? "Remove from Liked Songs" : "Add to Liked Songs"}
            </ContextMenuItem>

          </ContextMenuGroup>

          <ContextMenuSeparator className="bg-white/10" />

          <ContextMenuGroup>
            <ContextMenuSub>

              <ContextMenuSubTrigger onClick={() => { }}
                className="focus:bg-white/10 focus:text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add to Playlist
              </ContextMenuSubTrigger>

              <ContextMenuSubContent className="w-40 bg-[#282828] text-white border-white/10">
                {useLoginStatus() && (filteredPlaylists.map((playlist: NeteasePlaylist) => (
                  <ContextMenuItem
                    onClick={async () => {
                      try {
                        await updatePlaylistTrack("add", playlist.id, trackID);
                        toast.success("已成功添加到歌单");
                      } catch (err) {
                        toast.error("添加到歌单失败");
                      }
                    }}
                    key={playlist.id} className="focus:bg-white/10 focus:text-white">
                    {playlist.name}
                  </ContextMenuItem>
                )))}
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
          </ContextMenuGroup>

          <ContextMenuSeparator className="bg-white/10" />

          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                setPendingDelete({ playlistId: currentPlaylistId!, trackId: trackID });
                setConfirmDialogOpen(true);
              }}
              variant="destructive" className="focus:bg-red-500 focus:text-white">
              <Trash className="w-4 h-4 mr-2" />
              Remove from current playlist
            </ContextMenuItem>
          </ContextMenuGroup>

        </ContextMenuContent>

      </ContextMenu>
    </>
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
  const tracks = useUserStore((state: any) => state.albumList);
  const likelist = useUserStore((s) => s.likeListIDs);
  const { setQueue, playQueueIndex, setIsPlaying } = usePlayerStore.getState();
  const currentSongDetail = usePlayerStore((s: any) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s: any) => s.isPlaying);
  const playlistID = useSearchParams().get("id");

  // OPTIMIZE: 搜索功能：如果 searchQuery 为空，则直接返回原始 tracks，避免不必要的 filter 运算；否则进行过滤。
  const filteredTracks = useMemo(() => {
    if (!searchQuery?.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter((track: any) =>
      (track.name?.toLowerCase?.() || "").includes(q) ||
      (Array.isArray(track.ar) && track.ar.some((a: any) => (a?.name?.toLowerCase?.() || "").includes(q))) ||
      (track.al?.name?.toLowerCase?.() || "").includes(q)
    );
  }, [tracks, searchQuery]);

  const handlePlay = (index: number) => {
    // 注意：这里用 filteredTracks 的 index 对应原始 tracks 的位置
    const track = filteredTracks[index];
    const originalIndex = tracks.findIndex((t: any) => t.id === track.id);
    const isCurrent = currentSongDetail?.id === track.id;
    if (isCurrent) {
      setIsPlaying(!isPlaying);
    } else {
      setQueue(tracks, originalIndex); // 队列仍然是完整的
      playQueueIndex(originalIndex);
    }
  };

  return (
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
          <TableHead className="hidden lg:table-cell text-zinc-400">Like</TableHead>
          <TableHead className="w-32 pr-8 text-zinc-400">
            <div className="flex justify-end items-center">
              <Clock className="w-4 h-4" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* 表身：用 filteredTracks 替换 tracks */}
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
            const isLiked = likelist.includes(track.id);
            return (
              <TrackRowContextMenu key={track.id} trackID={track.id} onPlay={() => handlePlay(index)} currentPlaylistId={playlistID!}>
                <TableRow
                  className={cn(
                    "group hover:bg-white/10 border-none transition-colors cursor-default",
                    isActive && "text-[#1ed760]"
                  )}
                  onDoubleClick={() => handlePlay(index)}
                >

                  {/* 下面所有 TableCell 数据源变成 filteredTracks */}

                  {/* 索引 */}
                  <TableCell className="text-center font-medium rounded-l-md">
                    <div className="relative w-4 h-4 mx-auto flex items-center justify-center">
                      <span className={cn(
                        "text-zinc-400 font-normal group-hover:hidden",
                        isActive && "hidden"
                      )}>
                        {index + 1}
                      </span>
                      {isActive && (
                        isPlaying ? (
                          <div className="flex gap-0.5 items-end h-3 group-hover:hidden">
                            <div className="w-0.5 bg-[#1ed760] animate-bar-1 rounded-sm" />
                            <div className="w-0.5 bg-[#1ed760] animate-bar-2 rounded-sm" />
                            <div className="w-0.5 bg-[#1ed760] animate-bar-3 rounded-sm" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 text-[#1ed760] fill-current group-hover:hidden" />
                        )
                      )}
                      <div className="hidden group-hover:flex items-center justify-center">
                        {isActive && isPlaying ? (
                          <Pause
                            className="w-4 h-4 text-[#1ed760] fill-current cursor-pointer"
                            onClick={() => setIsPlaying(false)}
                          />
                        ) : (
                          <Play
                            className="w-4 h-4 text-white fill-current cursor-pointer"
                            onClick={() => handlePlay(index)}
                          />
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* 歌曲名 */}
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
                  <TableCell className="hidden lg:table-cell truncate">
                    <button
                      title="Like"
                      onClick={() => {
                        const nextLiked = !isLiked;
                        likeSong(track.id, nextLiked)
                          .then(() => {
                            const store = useUserStore.getState();
                            if (nextLiked) {
                              store.setLikeListIDs([...store.likeListIDs, track.id]);
                            } else {
                              store.setLikeListIDs(store.likeListIDs.filter((id) => id !== track.id));
                              const isLikePlaylist = store.albumList.every(
                                (t: any) => store.likeListIDs.includes(t.id)
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
                    >
                      <Heart
                        className={cn(
                          "w-5 h-5 cursor-pointer ml-1 transition-colors",
                          isLiked
                            ? "fill-[#1ed760] text-[#1ed760]"
                            : "text-[#b3b3b3] hover:text-white"
                        )}
                      />
                    </button>
                  </TableCell>

                  {/* 播放所需时间 */}
                  <TableCell className="w-32 pr-8 rounded-r-md">
                    <div className="flex justify-end items-center">
                      <span title={formatDuration(track.dt)}>{formatDuration(track.dt)}</span>
                    </div>
                  </TableCell>

                </TableRow>
              </TrackRowContextMenu>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
