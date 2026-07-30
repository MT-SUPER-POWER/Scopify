"use client";

import { useEffect } from "react";

import type { DesktopLyricSnapshotInput } from "@/types/desktopLyric";

import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import { useUserStore } from "@/store/module/user";

/** Mirrors Scopify's player state into the optional Electron companion. */
export function useDesktopLyricPublisher() {
  useEffect(() => {
    if (!runtime.isDesktop) return;

    let lastPublishedAt = 0;
    const publish = (positionMs = useTimeStore.getState().currentTime, force = false) => {
      const now = Date.now();
      if (!force && now - lastPublishedAt < 90) return;
      lastPublishedAt = now;
      void runtime.desktopLyrics.publish(buildSnapshot(positionMs));
    };
    const onPlayerTime = (event: Event) => {
      const positionMs = (event as CustomEvent<unknown>).detail;
      if (typeof positionMs === "number" && Number.isFinite(positionMs)) publish(positionMs);
    };

    publish(undefined, true);
    window.addEventListener("player-time", onPlayerTime);
    const stopPlayerSubscription = usePlayerStore.subscribe(() => publish(undefined, true));
    const stopUserSubscription = useUserStore.subscribe(() => publish(undefined, true));
    return () => {
      window.removeEventListener("player-time", onPlayerTime);
      stopPlayerSubscription();
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
