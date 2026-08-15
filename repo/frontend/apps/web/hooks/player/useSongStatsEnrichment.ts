"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  enrichSongStatsById,
  getSongStatsEnrichmentState,
  subscribeSongStatsEnrichment,
} from "@/lib/song/enrichSongStats";
import type { SongDetail } from "@/types/api/music";

const EMPTY_STATS_STATE = getSongStatsEnrichmentState(null);

/** Keeps a song consumer informed while its interaction statistics are loaded. */
export function useSongStatsEnrichment(song: SongDetail | null, enabled = true) {
  const songId = song?.id ?? null;
  const likedCount = song?.likedCount;
  const commentCount = song?.commentCount;
  const voiceId = song?.voiceId;
  const state = useSyncExternalStore(
    subscribeSongStatsEnrichment,
    () => getSongStatsEnrichmentState(songId),
    () => EMPTY_STATS_STATE,
  );

  useEffect(() => {
    if (!enabled || songId === null) return;
    void enrichSongStatsById(songId, { commentCount, likedCount }, voiceId);
  }, [commentCount, enabled, likedCount, songId, voiceId]);

  const retry = useCallback(() => {
    if (!enabled || songId === null) return Promise.resolve(EMPTY_STATS_STATE);
    return enrichSongStatsById(songId, { commentCount, likedCount }, voiceId);
  }, [commentCount, enabled, likedCount, songId, voiceId]);

  return { retry, state };
}
