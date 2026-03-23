"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { memo, useCallback, useMemo } from "react";
import { Play, Pause, Heart, PlusCircle, Link2, ListPlus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { FaRegCommentDots } from "react-icons/fa6";
import { toast } from "sonner";

import { cn, formatDuration } from "@/lib/utils";
import { LikeButton } from "@/components/ui/LikeButton";
import { usePlayerStore, useUserStore } from "@/store";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { likeSong } from "@/lib/api/playlist";
import { updatePlaylistTrack } from "@/lib/api/track";
import { SongDetail } from "@/types/api/music";
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

import { Song } from "../_types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function songToSongDetail(song: Song): SongDetail {
  const picUrl = song.album.picUrl || song.artists[0]?.picUrl || "";
  return {
    id: song.id,
    name: song.name,
    dt: song.duration,
    ar: song.artists.map((a) => ({ id: a.id, name: a.name })),
    al: { id: song.album.id, name: song.album.name, picUrl },
    publishTime: song.album.publishTime || 0,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TRACK INDEX CELL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SongIndexCell({ index, isActive, isPlaying, onPlay, onPause }: {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}) {
  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      {/* 默认：序号 */}
      <span className={cn(
        "text-zinc-400 text-sm font-normal group-hover:hidden",
        isActive && "hidden"
      )}>
        {index + 1}
      </span>

      {/* 播放中：频谱动画 */}
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

      {/* 暂停中：静态绿色播放图标 */}
      {isActive && !isPlaying && (
        <Play className="w-4 h-4 text-[#1ed760] fill-current group-hover:hidden" />
      )}

      {/* Hover 覆盖：播放 / 暂停按钮 */}
      <div className="hidden group-hover:flex items-center justify-center">
        {isActive && isPlaying ? (
          <Pause className="w-4 h-4 text-[#1ed760] fill-current cursor-pointer" onClick={onPause} />
        ) : (
          <Play className="w-4 h-4 text-white fill-current cursor-pointer" onClick={onPlay} />
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SONG ITEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SongItemProps {
  song: Song;
  index: number;
  /** 完整列表，用于构建播放队列 */
  songs: Song[];
}

export const SongItem = memo(function SongItem({ song, index, songs }: SongItemProps) {
  // ── store ──
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const likeListIDs = useUserStore((s) => s.likeListIDs);
  const playlists = useUserStore((s) => s.playlist);
  const isLoggedIn = useLoginStatus();

  // ── derived ──
  const isActive = currentSongDetail?.id === song.id;
  const isLiked = useMemo(
    () => Array.isArray(likeListIDs) && likeListIDs.includes(song.id),
    [likeListIDs, song.id]
  );

  // ── handlers ──
  const handlePlay = useCallback(() => {
    if (isActive) {
      setIsPlaying(true);
      return;
    }
    const queue = songs.map(songToSongDetail);
    setQueue(queue, index);
    playTrack(songToSongDetail(song));
  }, [isActive, songs, index, song, setIsPlaying, setQueue, playTrack]);

  const handlePause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

  const handleRowDoubleClick = useCallback(() => {
    if (isActive) {
      setIsPlaying(!isPlaying);
    } else {
      handlePlay();
    }
  }, [isActive, isPlaying, handlePlay, setIsPlaying]);

  const handleLike = useCallback(async (nextLiked: boolean) => {
    try {
      await likeSong(song.id, nextLiked);
      const store = useUserStore.getState();
      const current = Array.isArray(store.likeListIDs) ? store.likeListIDs : [];
      store.setLikeListIDs(
        nextLiked ? [...current, song.id] : current.filter((id: number) => id !== song.id)
      );
      toast.success(nextLiked ? "已添加到喜欢" : "已取消喜欢");
    } catch {
      toast.error("操作失败，请稍后再试");
    }
  }, [song.id]);

  const handleAddToQueue = useCallback(() => {
    const state = usePlayerStore.getState();
    if (state.queue.some((t) => t.id === song.id)) {
      toast.info("歌曲已在队列中");
      return;
    }
    state.setQueue([...state.queue, songToSongDetail(song)], state.queueIndex);
    toast.success("已添加到播放队列");
  }, [song]);

  const coverSrc = song.album.picUrl || song.artists[0]?.picUrl || "";
  const artistNames = song.artists.map((a) => a.name).join(", ") || "未知歌手";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "group flex items-center gap-3 px-3 py-2 rounded-md",
            "hover:bg-white/10 transition-colors cursor-default select-none",
            isActive && "text-[#1ed760]"
          )}
          onDoubleClick={handleRowDoubleClick}
        >
          {/* 序号 / 播放控件 */}
          <div className="w-6 flex-shrink-0 flex justify-center">
            <SongIndexCell
              index={index}
              isActive={isActive}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          </div>

          {/* 封面 */}
          <div className="w-10 h-10 shrink-0 rounded bg-zinc-800 overflow-hidden">
            <img
              src={coverSrc}
              alt={song.album.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }}
            />
          </div>

          {/* 歌名 + 歌手 */}
          <div className="flex flex-col min-w-0 flex-1">
            <span
              title={song.name}
              className={cn(
                "text-sm font-normal truncate",
                isActive ? "text-[#1ed760]" : "text-white"
              )}
            >
              {song.name}
            </span>
            <span
              title={artistNames}
              className="text-zinc-400 text-xs truncate hover:text-white hover:underline cursor-pointer"
            >
              {artistNames}
            </span>
          </div>

          {/* Like 按钮 */}
          <div className="flex-shrink-0 hidden sm:flex items-center">
            <LikeButton
              liked={isLiked}
              likedCount={0}
              onLike={() => handleLike(!isLiked)}
              iconClassName="w-4 h-4"
            />
          </div>

          {/* 时长 */}
          <div className="flex-shrink-0 w-12 text-right text-zinc-400 text-sm">
            {formatDuration(song.duration)}
          </div>
        </div>
      </ContextMenuTrigger>

      {/* ── Context Menu ── */}
      <ContextMenuContent className="w-52 bg-[#282828] text-white border-white/10">

        <ContextMenuGroup>
          <ContextMenuItem
            onClick={handleRowDoubleClick}
            className="focus:bg-white/10 focus:text-white"
          >
            {isActive && isPlaying
              ? <><Pause className="w-4 h-4 mr-2" />Pause</>
              : <><Play className="w-4 h-4 mr-2" />Play</>
            }
          </ContextMenuItem>

          <ContextMenuItem
            onClick={handleAddToQueue}
            className="focus:bg-white/10 focus:text-white"
          >
            <ListPlus className="w-4 h-4 mr-2" />
            Add to queue
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => handleLike(!isLiked)}
            className="focus:bg-white/10 focus:text-white"
          >
            <Heart className="w-4 h-4 mr-2" />
            {isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
          </ContextMenuItem>
        </ContextMenuGroup>

        <ContextMenuSeparator className="bg-white/10" />

        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
              <PlusCircle className="w-4 h-4 mr-4" />
              Add to Playlist
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="bg-[#282828] text-white border-white/10">
              {isLoggedIn && playlists.map((playlist) => (
                <ContextMenuItem
                  key={playlist.id}
                  onClick={async () => {
                    try {
                      await updatePlaylistTrack("add", playlist.id, song.id);
                      toast.success("已成功添加到歌单");
                    } catch {
                      toast.error("添加到歌单失败");
                    }
                  }}
                  className="focus:bg-white/10 focus:text-white"
                >
                  <img src={playlist.coverImgUrl} alt="cover" className="w-7 h-7 rounded-sm mr-2" />
                  {playlist.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
            <Link href={`/comment/?songId=${song.id}`} className="w-full h-full block">
              <FaRegCommentDots className="w-4 h-4 mr-2" />
              Comments
            </Link>
          </ContextMenuItem>

          <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(`https://music.163.com/#/song?id=${song.id}`)
                  .then(() => toast.success("链接已复制到剪贴板"))
                  .catch(() => toast.error("复制链接失败"));
              }}
              className="w-full h-full block"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Copy Link
            </button>
          </ContextMenuItem>
        </ContextMenuGroup>

      </ContextMenuContent>
    </ContextMenu>
  );
},
  // 精准 compare：只有这几个维度变化才重渲染
  (prev, next) =>
    prev.song.id === next.song.id &&
    prev.index === next.index &&
    prev.songs === next.songs
);
