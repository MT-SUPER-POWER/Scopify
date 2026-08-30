"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import {
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
} from "@/constants/personalFm";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { useI18n } from "@/store/module/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/api/music";
import type { PlaylistInfo } from "@/types/playlist";

export function usePersonalFmPlaylist() {
  const { t } = useI18n();
  const requireLogin = useRequireLoginAction();
  const selection = usePersonalFmStore((state) => state.selection);
  const status = usePersonalFmStore((state) => state.status);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const queue = usePlayerStore((state) => state.queue);

  const isCurrentSource = isPersonalFmPlaybackSource(playlistId);
  const tracks = useMemo(() => (isCurrentSource ? queue : []), [isCurrentSource, queue]);

  const start = useCallback(() => {
    void requireLogin(async () => {
      const started = await usePersonalFmStore.getState().start();
      if (!started) {
        toast.error(usePersonalFmStore.getState().error ?? t("personalFm.error.loadFailed"));
      }
    });
  }, [requireLogin, t]);

  const handlePlayToggle = useCallback(() => {
    const player = usePlayerStore.getState();
    if (isPersonalFmPlaybackSource(player.playlistId) && player.currentSongDetail) {
      player.setIsPlaying(!player.isPlaying);
      return;
    }

    start();
  }, [start]);

  const handleTrackPlay = useCallback(
    (track: SongDetail) => {
      const player = usePlayerStore.getState();
      const isCurrentTrack =
        isPersonalFmPlaybackSource(player.playlistId) && player.currentSongDetail?.id === track.id;
      if (isCurrentTrack) {
        player.setIsPlaying(!player.isPlaying);
        return;
      }

      player.setShuffle(false);
      player.setRepeatMode("off");
      void player.playFromSong(track, tracks, PERSONAL_FM_PLAYBACK_SOURCE_ID);
    },
    [tracks],
  );

  const playlistInfo = useMemo<PlaylistInfo>(
    () => ({
      cover: currentSong?.al.picUrl ?? "/personal-fm-cover.svg",
      createTime: "",
      creator: "",
      creatorAvatar: "",
      isSpecial: true,
      likes: 0,
      privacy: t("personalFm.queue.dynamic"),
      tags: [getPersonalFmSelectionLabel(selection, t)],
      title: t("personalFm.title"),
      totalSongs: tracks.length,
    }),
    [currentSong?.al.picUrl, selection, t, tracks.length],
  );

  return {
    isLoading: status === "loading",
    onPlayToggle: handlePlayToggle,
    onTrackPlay: handleTrackPlay,
    playlistInfo,
    playSourceId: PERSONAL_FM_PLAYBACK_SOURCE_ID,
    refetchTracks: start,
    themeColor: null,
    tracks,
  };
}
