"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Disc3, Heart, Link2, ListPlus, Pause, Play, PlusCircle, User } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useMemo } from "react";
import { FaRegCommentDots } from "react-icons/fa6";
import { toast } from "sonner";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
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
import { LikeButton } from "@/components/ui/LikeButton";
import { usePlaylistTrackMutation } from "@/hooks/playlist/usePlaylistTrackMutation";
import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { Song } from "@/types/search";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function songToSongDetail(song: Song): SongDetail {
  const picUrl = song.album.picUrl || song.artists[0]?.picUrl || "";
  return {
    id: song.id,
    name: song.name,
    dt: song.duration,
    fee: song.fee ?? 0,
    ar: song.artists.map((a) => ({ id: a.id, name: a.name })),
    al: { id: song.album.id, name: song.album.name, picUrl },
    publishTime: song.album.publishTime || 0,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TRACK INDEX CELL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SongIndexCell({
  index,
  isActive,
  isPlaying,
  onPlay,
  onPause,
}: {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}) {
  return (
    <div className="relative flex size-4 items-center justify-center">
      {/* 默认：序号 */}
      <span
        className={cn(
          "text-content-muted text-sm font-normal group-hover:hidden",
          isActive && "hidden",
        )}
      >
        {index + 1}
      </span>

      {/* 播放中：频谱动画 */}
      {isActive && isPlaying && (
        <div className="flex h-3 shrink-0 items-end gap-0.5 group-hover:hidden">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.div
              key={delay}
              className="bg-brand w-0.5 rounded-full"
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
              style={{ height: "100%", originY: 1 }}
            />
          ))}
        </div>
      )}

      {/* 暂停中：静态绿色播放图标 */}
      {isActive && !isPlaying && (
        <Play className="text-brand size-4 fill-current group-hover:hidden" />
      )}

      {/* Hover 覆盖：播放 / 暂停按钮 */}
      <div className="hidden items-center justify-center group-hover:flex">
        {isActive && isPlaying ? (
          <Pause className="text-brand size-4 cursor-pointer fill-current" onClick={onPause} />
        ) : (
          <Play className="text-content size-4 cursor-pointer fill-current" onClick={onPlay} />
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

export const SongItem = memo(
  function SongItem({ song, index, songs }: SongItemProps) {
    const { t } = useI18n();
    const { mutateAsync: updatePlaylistTrack } = usePlaylistTrackMutation();
    // ── store ──
    const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
    const setQueue = usePlayerStore((s) => s.setQueue);
    const playTrack = usePlayerStore((s) => s.playTrack);
    const likeListIDs = useUserStore((s) => s.likeListIDs);
    const playlists = useUserStore((s) => s.playlist);

    // ── derived ──
    const isActive = currentSongDetail?.id === song.id;
    const isLogin = useLoginStatus();
    const isLiked = useMemo(
      () => Array.isArray(likeListIDs) && likeListIDs.includes(song.id),
      [likeListIDs, song.id],
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

    const handleLike = useCallback(
      async (nextLiked: boolean) => {
        try {
          await likeSong(song.id, nextLiked);
          const store = useUserStore.getState();
          const current = Array.isArray(store.likeListIDs) ? store.likeListIDs : [];
          store.setLikeListIDs(
            nextLiked ? [...current, song.id] : current.filter((id: number) => id !== song.id),
          );
          void clearPageCache();
          toast.success(
            nextLiked ? t("playlist.table.likedAdded") : t("playlist.table.likedRemoved"),
          );
        } catch (error) {
          console.error("Failed to toggle like:", error);
          // toast.error("操作失败，请稍后再试");
        }
      },
      [song.id, t],
    );

    const handleAddToQueue = useCallback(() => {
      const state = usePlayerStore.getState();
      if (state.queue.some((t) => t.id === song.id)) {
        toast.info(t("playlist.table.queueExists"));
        return;
      }
      state.setQueue([...state.queue, songToSongDetail(song)], state.queueIndex);
      toast.success(t("playlist.table.queueAdded"));
    }, [song, t]);

    const coverSrc = song.album.picUrl || song.artists[0]?.picUrl || "";

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2",
              "hover:bg-content/10 cursor-default transition-colors select-none",
              isActive && "text-brand",
            )}
            onDoubleClick={handleRowDoubleClick}
          >
            {/* 序号 / 播放控件 */}
            <div className="flex w-6 shrink-0 justify-center">
              <SongIndexCell
                index={index}
                isActive={isActive}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
              />
            </div>

            {/* 封面 */}
            <div className="bg-surface-elevated size-10 shrink-0 overflow-hidden rounded">
              <Image
                width={40}
                height={40}
                src={coverSrc}
                alt={song.album.name}
                loading="lazy"
                className="size-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "";
                }}
              />
            </div>

            {/* 歌名 + 歌手 */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  title={song.name}
                  className={cn(
                    "truncate text-sm font-normal",
                    isActive ? "text-brand" : "text-content",
                  )}
                >
                  {song.name}
                </span>
                {song.alias?.length ? (
                  <span className="text-content-subtle truncate text-xs">
                    ({song.alias.join(" / ")})
                  </span>
                ) : null}
                <SongVipBadge fee={song.fee} />
                {song.mvid ? (
                  <span
                    className="border-info text-info bg-info/10 inline-flex h-[13px] shrink-0 items-center rounded-xs border px-[2px] text-[9px] leading-[11px] font-normal"
                    title="MV"
                  >
                    MV
                  </span>
                ) : null}
              </div>
              <ArtistInlineLinks
                artists={song.artists.map((a) => ({ id: a.id, name: a.name }))}
                className="text-content-muted cursor-pointer truncate text-xs"
              />
            </div>

            <div className="hidden min-w-0 flex-[0.55] items-center gap-2 lg:flex">
              <Disc3 className="text-content-subtle size-3.5 shrink-0" aria-hidden="true" />
              <Link
                href={`/album?id=${song.album.id}`}
                title={song.album.name}
                onClick={(event) => event.stopPropagation()}
                className="text-content-muted hover:text-content truncate text-xs transition-colors hover:underline"
              >
                {song.album.name}
              </Link>
            </div>

            {/* Like 按钮 */}
            <div className="hidden shrink-0 items-center sm:flex">
              <LikeButton
                liked={isLiked}
                onLike={() => handleLike(!isLiked)}
                iconClassName="w-4 h-4"
              />
            </div>

            {/* 时长 */}
            <div className="text-content-muted w-12 shrink-0 text-right text-sm">
              {formatDuration(song.duration)}
            </div>
          </div>
        </ContextMenuTrigger>

        {/* ── Context Menu ── */}
        <ContextMenuContent className="w-52">
          <ContextMenuGroup>
            <ContextMenuItem onClick={handleRowDoubleClick}>
              {isActive && isPlaying ? (
                <>
                  <Pause className="mr-2 size-4" />
                  {t("contextMenu.pause")}
                </>
              ) : (
                <>
                  <Play className="mr-2 size-4" />
                  {t("contextMenu.play")}
                </>
              )}
            </ContextMenuItem>

            {/* 添加到播放队列中 */}
            {isLogin && (
              <ContextMenuItem onClick={handleAddToQueue}>
                <ListPlus className="mr-2 size-4" />
                {t("contextMenu.addToQueue")}
              </ContextMenuItem>
            )}

            {/* 取消喜欢或者喜欢 */}
            {isLogin && (
              <ContextMenuItem onClick={() => handleLike(!isLiked)}>
                <Heart className="mr-2 size-4" />
                {isLiked ? t("contextMenu.removeFromLiked") : t("contextMenu.addToLiked")}
              </ContextMenuItem>
            )}
          </ContextMenuGroup>

          <ContextMenuSeparator />

          <ContextMenuGroup>
            {/* 添加到播放列表 */}
            {isLogin && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <PlusCircle className="mr-4 size-4" />
                  {t("contextMenu.addToPlaylist")}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {playlists.map((playlist) => (
                    <ContextMenuItem
                      key={playlist.id}
                      onClick={async () => {
                        try {
                          await updatePlaylistTrack({
                            operation: "add",
                            playlistId: playlist.id,
                            trackId: song.id,
                          });
                          void clearPageCache();
                          toast.success(t("playlist.table.addToPlaylistSuccess"));
                        } catch {
                          toast.error(t("playlist.table.addToPlaylistFailed"));
                        }
                      }}
                    >
                      <Image
                        width={28}
                        height={28}
                        src={playlist.coverImgUrl}
                        alt={t("playlist.form.coverAlt")}
                        className="mr-2 size-7 rounded-sm"
                      />
                      {playlist.name}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            <ContextMenuItem asChild>
              <Link href={`/comment/?songId=${song.id}`} className="block size-full">
                <FaRegCommentDots className="mr-2 size-4" />
                {t("contextMenu.comments")}
              </Link>
            </ContextMenuItem>

            <ContextMenuItem asChild>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    .writeText(`https://music.163.com/#/song?id=${song.id}`)
                    .then(() => toast.success(t("common.message.linkCopied")))
                    .catch(() => toast.error(t("common.message.copyFailed")));
                }}
                className="block size-full"
              >
                <Link2 className="mr-2 size-4" />
                {t("contextMenu.copyLink")}
              </button>
            </ContextMenuItem>

            {/* View Artist */}
            {song.artists.length > 0 &&
              (song.artists.length === 1 ? (
                <ContextMenuItem asChild>
                  <Link href={`/artist?id=${song.artists[0].id}`} className="block size-full">
                    <User className="mr-2 size-4" />
                    {t("contextMenu.goToArtist")}
                  </Link>
                </ContextMenuItem>
              ) : (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <User className="mr-4 size-4" />
                    {t("contextMenu.goToArtist")}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {song.artists.map((artist) => (
                      <ContextMenuItem key={artist.id} asChild>
                        <Link href={`/artist?id=${artist.id}`} className="block size-full">
                          {artist.name}
                        </Link>
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              ))}
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
  // 只有这几个维度变化才重渲染
  (prev, next) =>
    prev.song.id === next.song.id && prev.index === next.index && prev.songs === next.songs,
);
