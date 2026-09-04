"use client";

import {
  Ban,
  Heart,
  Link2,
  ListPlus,
  Pause,
  Play,
  PlusCircle,
  ScrollText,
  Trash,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
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
import { usePlaylistTrackMutation } from "@/hooks/playlist/usePlaylistTrackMutation";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { useSongStatsEnrichment } from "@/hooks/player/useSongStatsEnrichment";
import { useVoiceLike } from "@/hooks/voice/useVoiceLike";
import { getCommentHref } from "@/lib/comment/commentResource";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { formatCompactCount } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { NeteasePlaylist } from "@/types/api/playlist";
import type { SongContextMenuProps } from "@/types/components/songContextMenu";

export function SongContextMenu({
  children,
  isActive,
  isDailyRecommend = false,
  isPlaying,
  onDislikeDailyRecommend,
  onDislikePersonalFm,
  onPlay,
  onRemoveFromPlaylist,
  onRemoveFromQueue,
  onRequestDelete: _onRequestDelete,
  onViewTranscript,
  playlistID,
  readonly = false,
  song,
}: SongContextMenuProps) {
  const { t } = useI18n();
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const songStats = useSongStatsEnrichment(song, isContextMenuOpen);
  const songLikeMutation = useSongLikeMutation();
  const isLogin = useLoginStatus();
  const likedList = useUserStore((s) => s.likeListIDs);
  const { isLiked: isLikedVoice, toggleLike: toggleVoiceLike } = useVoiceLike(song.voiceId ?? null);
  const isLikedSong = useMemo(() => likedList?.includes(song.id), [likedList, song.id]);
  const isLiked = song.voiceId === undefined ? isLikedSong : isLikedVoice;
  const playlists = useUserStore((s) => s.playlist);
  const { mutateAsync: updatePlaylistTrack } = usePlaylistTrackMutation();
  const commentCount = song.commentCount ?? songStats.state.stats.commentCount;

  const filteredPlaylists = useMemo(
    () => playlists.filter((p: NeteasePlaylist) => String(p.id) !== String(playlistID)),
    [playlists, playlistID],
  );

  const handleLike = useCallback(
    async (e: React.MouseEvent | Event) => {
      e.stopPropagation();
      if (song.voiceId !== undefined) {
        await toggleVoiceLike();
        return;
      }
      songLikeMutation.mutate({ like: !isLiked, songId: song.id });
    },
    [isLiked, song.id, song.voiceId, songLikeMutation, toggleVoiceLike],
  );

  const handleAddToQueue = useCallback(() => {
    const state = usePlayerStore.getState();
    const alreadyInQueue = state.queue.some((t) => t.id === song.id);
    if (alreadyInQueue) {
      toast.info(t("playlist.table.queueExists"));
      return;
    }
    state.setQueue([...state.queue, song], state.queueIndex);
    toast.success(t("playlist.table.queueAdded"));
  }, [song, t]);

  const handleCopyLink = useCallback(() => {
    const id = song.voiceId ?? song.id;
    const type = song.voiceId ? "dj" : "song";
    const href = `https://music.163.com/#/${type}?id=${id}`;
    navigator.clipboard
      .writeText(href)
      .then(() => toast.success(t("playlist.table.copySuccess")))
      .catch(() => toast.error(t("playlist.table.copyFailed")));
  }, [song.id, song.voiceId, t]);

  return (
    <ContextMenu onOpenChange={setIsContextMenuOpen}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="z-9999 w-48">
        <ContextMenuGroup>
          <ContextMenuItem onClick={onPlay}>
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

          {isLogin && (
            <>
              {/* Add to Queue (If not already in queue/table context) */}
              {!onRemoveFromQueue && (
                <ContextMenuItem onClick={handleAddToQueue}>
                  <ListPlus className="mr-2 size-4" />
                  {t("contextMenu.addToQueue")}
                </ContextMenuItem>
              )}

              <ContextMenuItem onClick={handleLike}>
                <Heart className="mr-2 size-4" />
                {isLiked ? t("contextMenu.removeFromLiked") : t("contextMenu.addToLiked")}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuGroup>

        <ContextMenuSeparator />

        <ContextMenuGroup>
          {onViewTranscript && (
            <ContextMenuItem onClick={onViewTranscript}>
              <ScrollText className="mr-2 size-4" />
              {t("search.voice.transcript")}
            </ContextMenuItem>
          )}

          {isLogin && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <PlusCircle className="mr-4 size-4" />
                {t("contextMenu.addToPlaylist")}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="z-9999">
                {filteredPlaylists.map((playlist: NeteasePlaylist) => (
                  <ContextMenuItem
                    onClick={async () => {
                      try {
                        await updatePlaylistTrack({
                          operation: "add",
                          playlistId: playlist.id,
                          trackId: song.id,
                        });
                        toast.success(t("playlist.table.addToPlaylistSuccess"));
                      } catch {
                        toast.error(t("playlist.table.addToPlaylistFailed"));
                      }
                    }}
                    key={playlist.id}
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

          <ContextMenuItem asChild className="w-full">
            <Link
              href={
                song.voiceId !== undefined
                  ? getCommentHref("voice", song.voiceId)
                  : getCommentHref("song", song.id)
              }
              className="block size-full"
            >
              <FaRegCommentDots className="mr-2 size-4" />
              {commentCount === undefined
                ? t("contextMenu.comments")
                : t("contextMenu.commentsWithCount", {
                    count: formatCompactCount(commentCount),
                  })}
            </Link>
          </ContextMenuItem>

          {song.ar &&
            song.ar.length > 0 &&
            (song.ar.length === 1 ? (
              <ContextMenuItem asChild className="w-full">
                <Link href={`/artist?id=${song.ar[0].id}`} className="block size-full">
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
                <ContextMenuSubContent className="z-9999">
                  {song.ar.map((artist) => (
                    <ContextMenuItem key={artist.id} asChild>
                      <Link href={`/artist?id=${artist.id}`} className="block size-full">
                        {artist.name}
                      </Link>
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            ))}

          <ContextMenuItem asChild className="w-full">
            <button type="button" onClick={handleCopyLink} className="block size-full text-left">
              <Link2 className="mr-2 size-4" />
              {t("contextMenu.copyLink")}
            </button>
          </ContextMenuItem>
        </ContextMenuGroup>

        {/* Queue removal */}
        {onRemoveFromQueue && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={onRemoveFromQueue} variant="destructive">
                <Trash className="mr-2 size-4" />
                {t("contextMenu.removeFromQueue")}
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}

        {/* Playlist removal */}
        {isLogin && !readonly && !isDailyRecommend && onRemoveFromPlaylist && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={onRemoveFromPlaylist} variant="destructive">
                <Trash className="mr-2 size-4" />
                {t("contextMenu.removeFromPlaylist")}
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}

        {/* Daily recommendation dislike */}
        {isDailyRecommend && isLogin && onDislikeDailyRecommend && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={onDislikeDailyRecommend} variant="destructive">
                <Ban className="mr-2 size-4" />
                {t("contextMenu.recommendLess")}
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}

        {/* Personal FM dislike */}
        {isLogin && onDislikePersonalFm && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem onClick={onDislikePersonalFm} variant="destructive">
                <Ban className="mr-2 size-4" />
                {t("contextMenu.recommendLess")}
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
