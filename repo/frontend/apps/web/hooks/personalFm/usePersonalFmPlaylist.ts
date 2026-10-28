"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";

import {
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
  isPersonalFmRoute,
} from "@/constants/personalFm";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { usePersonalFmDislike } from "@/hooks/personalFm/usePersonalFmDislike";
import { useCoverThemeColor } from "@/hooks/playlist/useCoverThemeColor";
import { useI18n } from "@/store/module/i18n";
import { ensurePersonalFmOnEntry } from "@/lib/personalFm/entry";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/song/api";
import type { PlaylistInfo } from "@/types/playlist/model";

export function usePersonalFmPlaylist() {
  const { t } = useI18n();
  const requireLogin = useRequireLoginAction();
  const isLoggedIn = useLoginStatus();
  const pathname = usePathname();
  const selection = usePersonalFmStore((state) => state.selection);
  const status = usePersonalFmStore((state) => state.status);
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const queue = usePlayerStore((state) => state.queue);
  const savedTracks = usePersonalFmStore((state) => state.tracks);
  const { dislike: onDislikeTrack } = usePersonalFmDislike();

  const isCurrentSource = isPersonalFmPlaybackSource(playlistId);
  const tracks = isCurrentSource ? queue : savedTracks;

  const start = useCallback(() => {
    void requireLogin(async () => {
      const started = await usePersonalFmStore.getState().start();
      if (!started) {
        toast.error(usePersonalFmStore.getState().error ?? t("personalFm.error.loadFailed"));
      }
    });
  }, [requireLogin, t]);

  useEffect(() => {
    if (!isLoggedIn || !isPersonalFmRoute(pathname)) return;
    // Defer until effect setup settles so Strict Mode does not request twice.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void ensurePersonalFmOnEntry(() => !cancelled);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, pathname]);

  const handlePlayToggle = useCallback(() => {
    const player = usePlayerStore.getState();
    if (isPersonalFmPlaybackSource(player.playlistId) && player.currentSongDetail) {
      player.setIsPlaying(!player.isPlaying);
      return;
    }

    if (tracks.length > 0) {
      void requireLogin(async () => {
        player.setShuffle(false);
        player.setRepeatMode("off");
        await player.playFromSong(tracks[0], tracks, PERSONAL_FM_PLAYBACK_SOURCE_ID);
      });
    } else start();
  }, [requireLogin, start, tracks]);

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

  const cover =
    (isCurrentSource ? currentSong?.al.picUrl : undefined) ||
    tracks[0]?.al.picUrl ||
    "/personal-fm-cover.svg";
  const themeColor = useCoverThemeColor(cover);
  const playlistInfo = useMemo<PlaylistInfo>(
    () => ({
      cover,
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
    [cover, selection, t, tracks.length],
  );

  return {
    isLoading: status === "loading" && tracks.length === 0,
    isRefreshing: status === "loading",
    onDislikeTrack,
    onPlayToggle: handlePlayToggle,
    onTrackPlay: handleTrackPlay,
    playlistInfo,
    playSourceId: PERSONAL_FM_PLAYBACK_SOURCE_ID,
    refetchTracks: start,
    themeColor,
    tracks,
  };
}
