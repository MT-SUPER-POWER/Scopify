"use client";

import { useMemo } from "react";

import { toNeteaseSongDetail } from "@/lib/providers/netease/adapters/track";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/song/api";

/**
 * The current track as a NetEase song, for NetEase-only features (lyrics, comments, stats,
 * sharing). Null when nothing plays or the track is from another platform.
 */
export function useCurrentNeteaseSong(): SongDetail | null {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  return useMemo(() => toNeteaseSongDetail(currentTrack), [currentTrack]);
}
