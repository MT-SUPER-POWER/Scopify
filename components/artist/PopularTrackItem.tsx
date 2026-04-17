"use client";

import { Heart, Link2, ListPlus, Pause, Play, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useMemo, useState } from "react";
import { FaRegCommentDots } from "react-icons/fa6";
import { toast } from "sonner";
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
import { likeSong } from "@/lib/api/playlist";
import { updatePlaylistTrack } from "@/lib/api/track";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { cn } from "@/lib/utils";
import SPOTIFYANIME from "@/resources/eq-playing.svg";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { NeteasePlaylist } from "@/types/api/playlist";
import { type ArtistInfo, formatDuration } from "@/types/artist";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ INDEX CELL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TrackIndexCell({
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
  const { t } = useI18n();

  return (
    <div className="w-6 text-right text-gray-400 text-sm tabular-nums relative flex items-center justify-center">
      {/* 默认：序号 */}
      <span className={cn("group-hover:hidden", isActive ? "text-[#1DB954] font-bold hidden" : "")}>
        {index + 1}
      </span>

      {/* 播放中：频谱动画 */}
      {isActive && isPlaying && (
        <div className="flex items-end gap-0.5 h-3 shrink-0 group-hover:hidden">
          <Image
            src={SPOTIFYANIME}
            alt={t("common.status.playing")}
            width={14}
            height={14}
            unoptimized
          />
        </div>
      )}

      {/* 暂停中：静态绿色 Play */}
      {isActive && !isPlaying && (
        <Play className="w-4 h-4 text-[#1DB954] fill-current group-hover:hidden" />
      )}

      {/* Hover 覆盖 */}
      <div className="hidden group-hover:flex items-center justify-center">
        {isActive && isPlaying ? (
          <Pause className="w-4 h-4 text-white fill-white cursor-pointer" onClick={onPause} />
        ) : (
          <Play className="w-4 h-4 text-white fill-white cursor-pointer" onClick={onPlay} />
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TRACK ITEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Props {
  track: SongDetail;
  index: number;
  queue: SongDetail[];
  artist: ArtistInfo;
}

export const PopularTrackItem = memo(
  function PopularTrackItem({ track, index, queue }: Props) {
    const { t } = useI18n();
    // ── store ──
    const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
    const setQueue = usePlayerStore((s) => s.setQueue);
    const playTrack = usePlayerStore((s) => s.playTrack);
    const likeListIDs = useUserStore((s) => s.likeListIDs);
    const playlists = useUserStore((s) => s.playlist) as NeteasePlaylist[];
    const isLoggedIn = useLoginStatus();

    // ── derived ──
    const isActive = currentSongDetail?.id === track.id;
    const isLiked = useMemo(
      () => Array.isArray(likeListIDs) && likeListIDs.includes(track.id as number),
      [likeListIDs, track.id],
    );
    const [hovered, setHovered] = useState(false);

    // ── handlers ──
    const handlePlay = useCallback(() => {
      if (isActive) {
        setIsPlaying(true);
        return;
      }
      if (queue.length > 0) setQueue(queue, index);
      playTrack(queue[index] || pruneSongDetail(track));
      console.log("Playing track:", track.al.name, "with cover", track.al.picUrl);
    }, [isActive, queue, index, track, setIsPlaying, setQueue, playTrack]);

    const handlePause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

    const handleRowClick = useCallback(() => {
      isActive ? setIsPlaying(!isPlaying) : handlePlay();
    }, [isActive, isPlaying, handlePlay, setIsPlaying]);

    const handleLike = useCallback(
      async (next: boolean) => {
        try {
          await likeSong(track.id as number, next);
          const store = useUserStore.getState();
          // 规范化为 number[] 再更新
          const cur = Array.isArray(store.likeListIDs)
            ? store.likeListIDs.map((id) => Number(id))
            : [];
          const idNum = Number(track.id);
          const nextList: number[] = next ? [...cur, idNum] : cur.filter((id) => id !== idNum);
          store.setLikeListIDs(nextList);
          toast.success(next ? t("artist.track.likedAdded") : t("artist.track.likedRemoved"));
        } catch {
          toast.error(t("artist.track.operationFailed"));
        }
      },
      [track.id],
    );

    const handleAddToQueue = useCallback(() => {
      const state = usePlayerStore.getState();
      console.log("track info", track);
      const detail = queue[index] || pruneSongDetail(track);
      if (state.queue.some((t) => t.id === track.id)) {
        toast.info(t("artist.track.queueExists"));
        return;
      }
      state.setQueue([...state.queue, detail], state.queueIndex);
      toast.success(t("artist.track.queueAdded"));
    }, [queue, index, track]);

    // console.log("Track Data:", track);

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex items-center justify-between p-2 rounded-md",
              "hover:bg-white/10 transition-colors cursor-pointer select-none",
              isActive && "text-[#1DB954]",
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleRowClick}
          >
            {/* 左侧：序号 + 封面 + 标题 */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <TrackIndexCell
                index={index}
                isActive={isActive}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
              />
              <Image
                width={40}
                height={40}
                src={track.al.picUrl || track.al.coverUrl || ""}
                alt={track.name}
                className="w-10 h-10 object-cover rounded shrink-0"
              />
              <span
                className={cn(
                  "font-medium truncate max-w-50 md:max-w-xs",
                  isActive ? "text-[#1DB954]" : "text-white",
                )}
              >
                {track.name}
              </span>
            </div>

            {/* 右侧：Like + 时长 */}
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <div className={cn("transition-opacity", hovered ? "opacity-100" : "opacity-0")}>
                <LikeButton
                  liked={isLiked}
                  likedCount={0}
                  onLike={() => handleLike(!isLiked)}
                  iconClassName="w-4.5 h-4.5"
                />
              </div>
              <span className="w-10 text-right tabular-nums">{formatDuration(track.dt)}</span>
            </div>
          </div>
        </ContextMenuTrigger>

        {/* ── Context Menu ── */}
        <ContextMenuContent className="w-52 bg-[#282828] text-white border-white/10">
          <ContextMenuGroup>
            <ContextMenuItem
              onClick={handleRowClick}
              className="focus:bg-white/10 focus:text-white"
            >
              {isActive && isPlaying ? (
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

            <ContextMenuItem
              onClick={handleAddToQueue}
              className="focus:bg-white/10 focus:text-white"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              {t("contextMenu.addToQueue")}
            </ContextMenuItem>

            <ContextMenuItem
              onClick={() => handleLike(!isLiked)}
              className="focus:bg-white/10 focus:text-white"
            >
              <Heart className="w-4 h-4 mr-2" />
              {isLiked ? t("contextMenu.removeFromLiked") : t("contextMenu.addToLiked")}
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuSeparator className="bg-white/10" />

          <ContextMenuGroup>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="focus:bg-white/10 focus:text-white">
                <PlusCircle className="w-4 h-4 mr-4" />
                {t("contextMenu.addToPlaylist")}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-[#282828] text-white border-white/10">
                {isLoggedIn &&
                  playlists.map((p) => (
                    <ContextMenuItem
                      key={p.id}
                      onClick={async () => {
                        try {
                          await updatePlaylistTrack("add", p.id, track.id as number);
                          toast.success(t("artist.track.addToPlaylistSuccess"));
                        } catch {
                          toast.error(t("artist.track.addToPlaylistFailed"));
                        }
                      }}
                      className="focus:bg-white/10 focus:text-white"
                    >
                      <Image
                        width={28}
                        height={28}
                        src={p.coverImgUrl}
                        alt={t("playlist.form.coverAlt")}
                        className="w-7 h-7 rounded-sm mr-2"
                      />
                      {p.name}
                    </ContextMenuItem>
                  ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
              <Link href={`/comment/?songId=${track.id}`} className="w-full h-full block">
                <FaRegCommentDots className="w-4 h-4 mr-2" />
                {t("contextMenu.comments")}
              </Link>
            </ContextMenuItem>

            <ContextMenuItem asChild className="focus:bg-white/10 focus:text-white">
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(`https://music.163.com/#/song?id=${track.id}`)
                    .then(() => toast.success(t("artist.track.copySuccess")))
                    .catch(() => toast.error(t("artist.track.copyFailed")));
                }}
                className="w-full h-full block"
              >
                <Link2 className="w-4 h-4 mr-2" />
                {t("contextMenu.copyLink")}
              </button>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
  (prev, next) =>
    prev.track.id === next.track.id && prev.index === next.index && prev.queue === next.queue,
);
