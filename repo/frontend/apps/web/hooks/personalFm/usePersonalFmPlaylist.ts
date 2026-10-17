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
import { useI18n, useI18nStore } from "@/store/module/i18n";
import { translate } from "@/lib/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/api/music";
import type { PlaylistInfo } from "@/types/playlist";

const ENTRY_STREAM_WINDOW_MS = 30_000;
let entryStreamStartedAt: number | null = null;

/** Starts the stream while navigation to the page is still in flight; the page then skips its own start once. */
export function startPersonalFmStreamOnEntry() {
  entryStreamStartedAt = Date.now();
  return startPersonalFmStream();
}

function consumeEntryStream() {
  const startedAt = entryStreamStartedAt;
  entryStreamStartedAt = null;
  return startedAt !== null && Date.now() - startedAt < ENTRY_STREAM_WINDOW_MS;
}

/** Starts a fresh personal FM stream and reports a failed start with a toast. */
export async function startPersonalFmStream(shouldReportError: () => boolean = () => true) {
  const started = await usePersonalFmStore.getState().start();
  if (!started && shouldReportError()) {
    toast.error(
      usePersonalFmStore.getState().error ??
        translate(useI18nStore.getState().locale, "personalFm.error.loadFailed"),
    );
  }
  return started;
}

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
  const { dislike: onDislikeTrack } = usePersonalFmDislike();

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

  useEffect(() => {
    if (!isLoggedIn || !isPersonalFmRoute(pathname)) return;
    // Defer until effect setup settles so Strict Mode does not request twice.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || consumeEntryStream()) return;
      void startPersonalFmStream(() => !cancelled);
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
      cover: isCurrentSource
        ? (currentSong?.al.picUrl ?? "/personal-fm-cover.svg")
        : "/personal-fm-cover.svg",
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
    [currentSong?.al.picUrl, isCurrentSource, selection, t, tracks.length],
  );

  return {
    isLoading: status === "loading",
    onDislikeTrack,
    onPlayToggle: handlePlayToggle,
    onTrackPlay: handleTrackPlay,
    playlistInfo,
    playSourceId: PERSONAL_FM_PLAYBACK_SOURCE_ID,
    refetchTracks: start,
    themeColor: null,
    tracks,
  };
}
