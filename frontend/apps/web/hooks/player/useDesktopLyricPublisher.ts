"use client";

import { useEffect } from "react";

import type { DesktopLyricSnapshotInput } from "@/types/desktopLyric";

import { shouldPublishDesktopCompanionSnapshot } from "@/lib/desktopPlaybackWallpaper/playback";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { REMOTE_PLAYER_SNAPSHOT_EVENT } from "@/lib/player/remotePlayerState";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import { useUserStore } from "@/store/module/user";

const DESKTOP_LYRIC_PUBLISH_INTERVAL_MS = 90;
const DESKTOP_WALLPAPER_PUBLISH_INTERVAL_MS = 250;

/** Publishes the canonical playback snapshot consumed by every Electron companion window. */
export function useDesktopLyricPublisher() {
  useEffect(() => {
    if (!runtime.isDesktop) return;

    let lastDesktopLyricPublishedAt = 0;
    let lastWallpaperPublishedAt = 0;
    const publish = (positionMs = useTimeStore.getState().currentTime, force = false) => {
      const now = Date.now();
      if (!force && now - lastDesktopLyricPublishedAt < DESKTOP_LYRIC_PUBLISH_INTERVAL_MS) return;
      lastDesktopLyricPublishedAt = now;
      const snapshot = buildSnapshot(positionMs);
      void runtime.desktopLyrics.publish(snapshot);
      if (
        shouldPublishDesktopCompanionSnapshot(
          force,
          now - lastWallpaperPublishedAt,
          DESKTOP_WALLPAPER_PUBLISH_INTERVAL_MS,
        )
      ) {
        lastWallpaperPublishedAt = now;
        void runtime.desktopPlaybackWallpaper.publishPresentation(snapshot);
      }
    };
    const onPlayerTime = (event: Event) => {
      const positionMs = (event as CustomEvent<unknown>).detail;
      if (typeof positionMs === "number" && Number.isFinite(positionMs)) publish(positionMs);
    };
    const onRemotePlayerSnapshot = () => publish(undefined, true);

    publish(undefined, true);
    window.addEventListener("player-time", onPlayerTime);
    window.addEventListener(REMOTE_PLAYER_SNAPSHOT_EVENT, onRemotePlayerSnapshot);
    const stopUserSubscription = useUserStore.subscribe(() => publish(undefined, true));
    return () => {
      window.removeEventListener("player-time", onPlayerTime);
      window.removeEventListener(REMOTE_PLAYER_SNAPSHOT_EVENT, onRemotePlayerSnapshot);
      stopUserSubscription();
    };
  }, []);
}

function buildSnapshot(positionMs: number): DesktopLyricSnapshotInput {
  const player = usePlayerStore.getState();
  const song = player.currentSongDetail;
  const likes = useUserStore.getState().likeListIDs;
  return {
    isLiked: song ? (Array.isArray(likes) ? likes.map(Number).includes(song.id) : false) : false,
    isPlaying: player.isPlaying,
    lyrics: player.lyric ? adaptNeteaseLyric(player.lyric) : null,
    positionMs: Math.max(0, positionMs),
    track: song
      ? {
          albumTitle: song.al.name,
          artistNames: song.ar.map((artist) => artist.name),
          artworkUrl: song.al.picUrl,
          durationMs: song.dt,
          id: song.id,
          title: song.name,
        }
      : null,
  };
}
