import { useEffect, useMemo, useRef, useState } from "react";
import { enrichSongsStats } from "@/lib/song/enrichSongStats";
import type { SongDetail, SongStats } from "@/types/api/music";

/** 为曲目列表后台补全 likedCount / commentCount，增量更新展示 */
export function useEnrichSongStats(tracks: SongDetail[]) {
  const trackIdsKey = tracks.map((t) => t.id).join(",");
  const [statsMap, setStatsMap] = useState<Record<number, SongStats>>({});
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅在曲目 id 列表变化时重新拉取统计
  useEffect(() => {
    setStatsMap({});
    const snapshot = tracksRef.current;
    if (!snapshot.length) return;

    let cancelled = false;

    enrichSongsStats(snapshot, (songId, stats) => {
      if (cancelled) return;
      setStatsMap((prev) => ({ ...prev, [songId]: { ...prev[songId], ...stats } }));
    });

    return () => {
      cancelled = true;
    };
  }, [trackIdsKey]);

  return useMemo(
    () =>
      tracks.map((song) => ({
        ...song,
        ...statsMap[song.id],
      })),
    [tracks, statsMap],
  );
}
