"use client";
import { useCallback, useMemo, type MouseEvent } from "react";
import { toast } from "sonner";
import { useBatchSongLike } from "@/hooks/playlist/useBatchSongLike";
import { usePlaylistTrackMutation } from "@/hooks/playlist/usePlaylistTrackMutation";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { useSongStatsEnrichment } from "@/hooks/player/useSongStatsEnrichment";
import { useVoiceLike } from "@/hooks/voice/useVoiceLike";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { NeteasePlaylist } from "@/types/api/playlist";
import type { SongContextMenuActionsProps } from "@/types/components/songContextMenu";

export function useSongContextMenuActions({
  isContextMenuOpen,
  selectedSongs,
  song,
  playlistID,
  onPlay,
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
  const userId = useUserStore((s) => s.user?.userId);
  const { mutateAsync: updatePlaylistTrack, isPending: isPlaylistPending } =
    usePlaylistTrackMutation();
  const commentCount = song.commentCount ?? songStats.state.stats.commentCount;

  const filteredPlaylists = useMemo(
    () =>
      playlists.filter((p) => p.creator?.userId === userId && String(p.id) !== String(playlistID)),
    [playlists, playlistID, userId],
  );

  const handleLike = useCallback(
    async (e: MouseEvent | Event) => {
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
      state.appendQueueItems(newItems);
      toast.success(`已将 ${newItems.length} 首歌曲添加到播放队列`);
      return;
    }
    const alreadyInQueue = state.queue.some((t) => t.id === song.id);
    if (alreadyInQueue) {
      toast.info(t("playlist.table.queueExists"));
      return;
    }
    state.appendQueueItems([song]);
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

  const handleAddToPlaylist = async (playlist: NeteasePlaylist) => {
    if (isPlaylistPending) return;
    try {
      await updatePlaylistTrack({
        operation: "add",
        playlistId: playlist.id,
        trackId: targetSongs.map((song) => song.id).join(","),
      });
      toast.success(t("playlist.table.addToPlaylistSuccess"));
    } catch {
      toast.error(t("playlist.table.addToPlaylistFailed"));
    }
  };
  return {
    t,
    isMulti,
    targetSongs,
    isLogin,
    isLiked,
    allTargetLiked,
    filteredPlaylists,
    commentCount,
    handleLike,
    handleAddToQueue,
    handleCopyLink,
    handlePlay,
    handleAddToPlaylist,
    isPlaylistPending,
  };
}
