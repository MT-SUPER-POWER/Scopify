"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  enrichSongStatsById,
  getSongStatsEnrichmentState,
  subscribeSongStatsEnrichment,
} from "@/lib/song/enrichSongStats";
import type { SongDetail } from "@/types/api/music";

const EMPTY_STATS_STATE = getSongStatsEnrichmentState(null);

/** Keeps the player bar informed while its current song statistics are loaded. */
export function useSongStatsEnrichment(song: SongDetail | null) {
  const songId = song?.id ?? null;
  const likedCount = song?.likedCount;
  const commentCount = song?.commentCount;
  const state = useSyncExternalStore(
    subscribeSongStatsEnrichment,
    () => getSongStatsEnrichmentState(songId),
    () => EMPTY_STATS_STATE,
  );

  useEffect(() => {
    if (songId === null) return;
    void enrichSongStatsById(songId, { commentCount, likedCount });
  }, [commentCount, likedCount, songId]);

  const retry = useCallback(() => {
    if (songId === null) return Promise.resolve(EMPTY_STATS_STATE);
    return enrichSongStatsById(songId, { commentCount, likedCount });
  }, [commentCount, likedCount, songId]);

  return { retry, state };
}
