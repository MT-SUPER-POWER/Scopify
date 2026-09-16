"use client";

import {
  Ban,
  FolderPlus,
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
import { useCallback, useMemo } from "react";
import { FaRegCommentDots } from "react-icons/fa6";
import { toast } from "sonner";
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { CreatePlaylistFromTracksDialog } from "@/components/shared/CreatePlaylistFromTracksDialog";
import { useBatchSongLike } from "@/hooks/playlist/useBatchSongLike";
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
import type { SongContextMenuActionsProps } from "@/types/components/songContextMenu";

export function SongContextMenuActions({
  isContextMenuOpen,
  isCreateDialogOpen,
  setIsCreateDialogOpen,
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
  selectedSongs,
  song,
}: SongContextMenuActionsProps) {
  const { t } = useI18n();
  const { batchLike } = useBatchSongLike();

  const isMulti = Boolean(
    selectedSongs && selectedSongs.length > 1 && selectedSongs.some((s) => s.id === song.id),
  );
  const targetSongs = useMemo(
    () => (isMulti && selectedSongs ? selectedSongs : [song]),
    [isMulti, selectedSongs, song],
  );

  const songStats = useSongStatsEnrichment(song, isContextMenuOpen);
  const songLikeMutation = useSongLikeMutation();
  const isLogin = useLoginStatus();
  const likedList = useUserStore((s) => s.likeListIDs);
  const { isLiked: isLikedVoice, toggleLike: toggleVoiceLike } = useVoiceLike(song.voiceId ?? null);
  const isLikedSong = useMemo(() => likedList?.includes(song.id), [likedList, song.id]);
  const isLiked = song.voiceId === undefined ? isLikedSong : isLikedVoice;

  const allTargetLiked = useMemo(() => {
    if (!likedList || targetSongs.length === 0) return false;
    const likeSet = new Set(likedList);
    return targetSongs.every((s) => likeSet.has(s.id));
  }, [likedList, targetSongs]);

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
      if (isMulti) {
        void batchLike(targetSongs, !allTargetLiked);
        return;
      }
      if (song.voiceId !== undefined) {
        await toggleVoiceLike();
        return;
      }
      songLikeMutation.mutate({ like: !isLiked, songId: song.id });
    },
    [
      isMulti,
      targetSongs,
      allTargetLiked,
      batchLike,
      song.voiceId,
      song.id,
      isLiked,
      songLikeMutation,
      toggleVoiceLike,
    ],
  );

  const handleAddToQueue = useCallback(() => {
    const state = usePlayerStore.getState();
    if (isMulti) {
      const existingQueueIds = new Set(state.queue.map((t) => t.id));
      const newItems = targetSongs.filter((t) => !existingQueueIds.has(t.id));
      if (newItems.length === 0) {
        toast.info(t("playlist.table.queueExists"));
        return;
      }
      state.setQueue([...state.queue, ...newItems], state.queueIndex);
      toast.success(`已将 ${newItems.length} 首歌曲添加到播放队列`);
      return;
    }
    const alreadyInQueue = state.queue.some((t) => t.id === song.id);
    if (alreadyInQueue) {
      toast.info(t("playlist.table.queueExists"));
      return;
    }
    state.setQueue([...state.queue, song], state.queueIndex);
    toast.success(t("playlist.table.queueAdded"));
  }, [isMulti, targetSongs, song, t]);

  const handleCopyLink = useCallback(() => {
    const id = song.voiceId ?? song.id;
    const type = song.voiceId ? "dj" : "song";
    const href = `https://music.163.com/#/${type}?id=${id}`;
    navigator.clipboard
      .writeText(href)
      .then(() => toast.success(t("playlist.table.copySuccess")))
      .catch(() => toast.error(t("playlist.table.copyFailed")));
  }, [song.id, song.voiceId, t]);

  const handlePlay = useCallback(() => {
    if (isMulti) {
      if (targetSongs.length === 0) return;
      const startSong = targetSongs.find((s) => s.id === song.id) ?? targetSongs[0];
      void usePlayerStore.getState().playFromSong(startSong, targetSongs, null);
      toast.success(`已开始播放所选歌曲 (${targetSongs.length} 首)`);
      return;
    }
    onPlay?.();
  }, [isMulti, targetSongs, song.id, onPlay]);

  return (
    <>
      {isContextMenuOpen && (
        <ContextMenuContent className="z-9999 w-48">
          <ContextMenuGroup>
            <ContextMenuItem onClick={handlePlay}>
              {isMulti ? (
                <>
                  <Play className="mr-2 size-4" />
                  {`播放所选 (${targetSongs.length} 首)`}
                </>
              ) : isActive && isPlaying ? (
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
                    {isMulti
                      ? `添加所选 (${targetSongs.length} 首) 到队列`
                      : t("contextMenu.addToQueue")}
                  </ContextMenuItem>
                )}

                <ContextMenuItem onClick={handleLike}>
                  <Heart className="mr-2 size-4" />
                  {isMulti
                    ? allTargetLiked
                      ? `取消喜欢 (${targetSongs.length} 首)`
                      : `喜欢 (${targetSongs.length} 首)`
                    : isLiked
                      ? t("contextMenu.removeFromLiked")
                      : t("contextMenu.addToLiked")}
                </ContextMenuItem>
              </>
            )}
          </ContextMenuGroup>

          {(isLogin || !isMulti) && <ContextMenuSeparator />}

          <ContextMenuGroup>
            {isLogin && (
              <>
                {/* 新建歌单并收纳所选歌曲 */}
                <ContextMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                  <FolderPlus className="mr-2 size-4" />
                  {isMulti
                    ? `新建歌单并收纳 (${targetSongs.length} 首)`
                    : t("sidebar.menu.createPlaylist")}
                </ContextMenuItem>

                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <PlusCircle className="mr-4 size-4" />
                    {isMulti
                      ? `添加所选 (${targetSongs.length} 首) 到歌单`
                      : t("contextMenu.addToPlaylist")}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="z-9999">
                    {filteredPlaylists.map((playlist: NeteasePlaylist) => (
                      <ContextMenuItem
                        onClick={async () => {
                          try {
                            await updatePlaylistTrack({
                              operation: "add",
                              playlistId: playlist.id,
                              trackId: targetSongs.map((s) => s.id).join(","),
                            });
                            toast.success(
                              isMulti
                                ? `已将 ${targetSongs.length} 首歌曲添加到歌单「${playlist.name}」`
                                : t("playlist.table.addToPlaylistSuccess"),
                            );
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
              </>
            )}

            {/* 单曲专属操作：多选时不可用 */}
            {!isMulti && (
              <>
                {onViewTranscript && (
                  <ContextMenuItem onClick={onViewTranscript}>
                    <ScrollText className="mr-2 size-4" />
                    {t("search.voice.transcript")}
                  </ContextMenuItem>
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
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="block size-full text-left"
                  >
                    <Link2 className="mr-2 size-4" />
                    {t("contextMenu.copyLink")}
                  </button>
                </ContextMenuItem>
              </>
            )}
          </ContextMenuGroup>

          {/* 单曲专属操作：多选时限制隐藏 */}
          {!isMulti && (
            <>
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
            </>
          )}
        </ContextMenuContent>
      )}
      {isCreateDialogOpen && (
        <CreatePlaylistFromTracksDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          tracks={targetSongs}
        />
      )}
    </>
  );
}
