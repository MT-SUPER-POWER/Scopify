"use client";

import { Heart, Link2, ListPlus, Pause, Play, PlusCircle, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { FaRegCommentDots } from "react-icons/fa6";
import { toast } from "sonner";

import { musicResourceKey } from "@scopify/music-domain/identity";

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
import { useTrackLikes } from "@/hooks/library/useLikedTracks";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { TrackVipBadge } from "@/components/shared/TrackBadges";
import { usePlaylistTrackMutation } from "@/hooks/playlist/usePlaylistTrackMutation";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { cn, formatDuration } from "@/lib/utils";
import SPOTIFYANIME from "@/resources/eq-playing.svg";
import { usePlayerStore, useUserStore } from "@/store";
import { useTranslation } from "react-i18next";

import type { PlayerTrack } from "@/types/player/model";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ INDEX CELL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Props {
  index: number;
  queue: readonly PlayerTrack[];
  track: PlayerTrack;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TRACK ITEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TrackIndexCell({
  index,
  isActive,
  isPlaying,
  onPause,
  onPlay,
}: {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPause: () => void;
  onPlay: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative flex w-6 items-center justify-center text-right text-sm text-content-muted tabular-nums">
      {/* 默认：序号 */}
      <span className={cn("group-hover:hidden", isActive ? "hidden font-bold text-brand" : "")}>
        {index + 1}
      </span>

      {/* 播放中：频谱动画 */}
      {isActive && isPlaying && (
        <div className="flex h-3 shrink-0 items-end gap-0.5 group-hover:hidden">
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
        <Play className="size-4 fill-current text-brand group-hover:hidden" />
      )}

      {/* Hover 覆盖 */}
      <div className="hidden items-center justify-center group-hover:flex">
        {isActive && isPlaying ? (
          <Pause className="size-4 cursor-pointer fill-current text-content" onClick={onPause} />
        ) : (
          <Play className="size-4 cursor-pointer fill-current text-content" onClick={onPlay} />
        )}
      </div>
    </div>
  );
}

export const PopularTrackItem = memo(
  function PopularTrackItem({ index, queue, track }: Props) {
    const { t } = useTranslation();
    // ── store ──
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
    const setQueue = usePlayerStore((s) => s.setQueue);
    const playTrack = usePlayerStore((s) => s.playTrack);
    const playlists = useUserStore((s) => s.playlist);
    const { isLiked: isTrackLiked } = useTrackLikes();
    const isLoggedIn = useLoginStatus();
    const { mutateAsync: updatePlaylistTrack } = usePlaylistTrackMutation();
    const songLikeMutation = useSongLikeMutation();

    // ── capabilities ──
    const canOpenArtist = useProviderCapability("artist.read");
    const canComment = useProviderCapability("comments.read");
    const canLike = useProviderCapability("track.like");
    const canManagePlaylists = useProviderCapability("playlist.manage");
    // Playlists, comments and the song link are NetEase's: other platforms' rows have no ID for them.
    const neteaseId = getNeteaseTrackId(track);

    // ── derived ──
    const trackKey = musicResourceKey(track.ref);
    const isActive = !!currentTrack && musicResourceKey(currentTrack.ref) === trackKey;
    const isLiked = isTrackLiked(track.ref);
    const [hovered, setHovered] = useState(false);

    // ── handlers ──
    const handlePlay = useCallback(() => {
      if (isActive) {
        setIsPlaying(true);
        return;
      }
      if (queue.length > 0) setQueue([...queue], index);
      void playTrack(track);
    }, [isActive, queue, index, track, setIsPlaying, setQueue, playTrack]);

    const handlePause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

    const handleRowClick = useCallback(() => {
      if (isActive) {
        setIsPlaying(!isPlaying);
      } else {
        handlePlay();
      }
    }, [isActive, isPlaying, setIsPlaying, handlePlay]);

    const handleLike = useCallback(
      (next: boolean) => {
        songLikeMutation.mutate({ like: next, track: track.ref });
      },
      [songLikeMutation, track.ref],
    );

    const handleAddToQueue = useCallback(() => {
      const state = usePlayerStore.getState();
      if (state.queue.some((queued) => musicResourceKey(queued.ref) === trackKey)) {
        toast.info(t("artist.track.queueExists"));
        return;
      }
      state.setQueue([...state.queue, track], state.queueIndex);
      toast.success(t("artist.track.queueAdded"));
    }, [track, trackKey, t]);

    const coverUrl = track.album?.coverUrl ?? "";

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex items-center justify-between rounded-md p-2",
              "cursor-pointer transition-colors select-none hover:bg-content/10",
              isActive && "text-brand",
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleRowClick}
          >
            {/* 左侧：序号 + 封面 + 标题 */}
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <TrackIndexCell
                index={index}
                isActive={isActive}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
              />
              <div className="size-10 shrink-0 overflow-hidden rounded bg-surface-elevated">
                {coverUrl ? (
                  <Image
                    width={40}
                    height={40}
                    src={getSizedImageUrl(coverUrl, 120)}
                    alt={track.title}
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    "max-w-50 truncate font-medium md:max-w-xs",
                    isActive ? "text-brand" : "text-content",
                  )}
                  title={track.title}
                >
                  {track.title}
                </span>
                <TrackVipBadge track={track} />
              </div>
            </div>

            {/* 右侧：Like + 时长 */}
            <div className="flex items-center gap-4 text-sm text-content-muted">
              {canLike && (
                <div className={cn("transition-opacity", hovered ? "opacity-100" : "opacity-0")}>
                  <LikeButton
                    liked={isLiked}
                    onLike={() => {
                      void handleLike(!isLiked);
                    }}
                    iconClassName="size-4.5"
                  />
                </div>
              )}
              <span className="w-10 text-right tabular-nums">
                {formatDuration(track.durationMs)}
              </span>
            </div>
          </div>
        </ContextMenuTrigger>

        {/* ── Context Menu ── */}
        <ContextMenuContent className="w-52">
          <ContextMenuGroup>
            <ContextMenuItem onClick={handleRowClick}>
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

            <ContextMenuItem onClick={handleAddToQueue}>
              <ListPlus className="mr-2 size-4" />
              {t("contextMenu.addToQueue")}
            </ContextMenuItem>

            {canLike && (
              <ContextMenuItem onClick={() => void handleLike(!isLiked)}>
                <Heart className="mr-2 size-4" />
                {isLiked ? t("contextMenu.removeFromLiked") : t("contextMenu.addToLiked")}
              </ContextMenuItem>
            )}
          </ContextMenuGroup>

          <ContextMenuSeparator />

          <ContextMenuGroup>
            {canManagePlaylists && neteaseId !== null && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <PlusCircle className="mr-4 size-4" />
                  {t("contextMenu.addToPlaylist")}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="scrollbar-thin max-h-72 max-w-80 overflow-y-auto">
                  {isLoggedIn &&
                    playlists.map((p) => (
                      <ContextMenuItem
                        key={p.id}
                        onClick={() => {
                          void (async () => {
                            try {
                              await updatePlaylistTrack({
                                operation: "add",
                                playlistId: p.id,
                                trackId: neteaseId,
                              });
                              void clearPageCache();
                              toast.success(t("artist.track.addToPlaylistSuccess"));
                            } catch {
                              toast.error(t("artist.track.addToPlaylistFailed"));
                            }
                          })();
                        }}
                      >
                        <Image
                          width={28}
                          height={28}
                          src={getSizedImageUrl(p.coverImgUrl, 80)}
                          alt={t("playlist.form.coverAlt")}
                          className="mr-2 size-7 rounded-sm"
                        />
                        {p.name}
                      </ContextMenuItem>
                    ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {canComment && neteaseId !== null && (
              <ContextMenuItem asChild>
                <Link href={`/comment/?songId=${neteaseId}`} className="block size-full">
                  <FaRegCommentDots className="mr-2 size-4" />
                  {t("contextMenu.comments")}
                </Link>
              </ContextMenuItem>
            )}

            {neteaseId !== null && (
              <ContextMenuItem asChild>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(`https://music.163.com/#/song?id=${neteaseId}`)
                      .then(() => toast.success(t("artist.track.copySuccess")))
                      .catch(() => toast.error(t("artist.track.copyFailed")));
                  }}
                  className="block size-full"
                >
                  <Link2 className="mr-2 size-4" />
                  {t("contextMenu.copyLink")}
                </button>
              </ContextMenuItem>
            )}

            {/* View Artist */}
            {canOpenArtist &&
              track.artists.length > 0 &&
              (track.artists.length === 1 ? (
                <ContextMenuItem asChild>
                  <Link href={`/artist?id=${track.artists[0].ref.id}`} className="block size-full">
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
                  <ContextMenuSubContent className="scrollbar-thin max-h-72 max-w-80 overflow-y-auto">
                    {track.artists.map((artist) => (
                      <ContextMenuItem key={artist.ref.id} asChild>
                        <Link href={`/artist?id=${artist.ref.id}`} className="block size-full">
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
  (prev, next) =>
    prev.track === next.track && prev.index === next.index && prev.queue === next.queue,
);
