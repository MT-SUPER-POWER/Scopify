import { getMusicComments, getVoiceComments } from "@/lib/api/comment";
import { getRadioProgramDetail } from "@/lib/api/radio";
import { getSongRedCount } from "@/lib/api/track";
import { getVoiceDetail } from "@/lib/api/voicelist";
import { usePlayerStore, useUserStore } from "@/store";
import type { SongDetail, SongStats } from "@/types/api/music";
import { reportFailure } from "@/lib/web/errorTracking";
import { createSongStatsEnricher, type SongStatsResource } from "@/lib/song/enrichSongStatsCore";

function parseRedCount(
  response: Awaited<ReturnType<typeof getSongRedCount>> | null,
): number | undefined {
  const body = response?.data;
  if (body?.code !== 200) return undefined;
  const count = body.data?.count ?? body.data?.likedCount;
  return typeof count === "number" && count >= 0 ? count : undefined;
}

function parseCommentTotal(
  response: Awaited<ReturnType<typeof getMusicComments | typeof getVoiceComments>> | null,
): number | undefined {
  const total = response?.data?.total;
  return typeof total === "number" && total >= 0 ? total : undefined;
}

async function getVoiceLikedCount(voiceId: number): Promise<number | undefined> {
  try {
    const response = await getRadioProgramDetail(voiceId);
    const likedCount = response.data?.program?.likedCount;
    if (typeof likedCount === "number") return likedCount;
  } catch {
    // New Voice resources can fall back to the login-aware detail endpoint.
  }

  const response = await getVoiceDetail(voiceId);
  return response.data?.data?.likedCount;
}

function loadLikedCount(resource: SongStatsResource): Promise<number | undefined> {
  if (resource.kind === "song") {
    return getSongRedCount(resource.id).then(parseRedCount);
  }
  return getVoiceLikedCount(resource.id);
}

function loadCommentCount(resource: SongStatsResource): Promise<number | undefined> {
  if (resource.kind === "song") {
    return getMusicComments({ id: resource.id, limit: 1, offset: 0 }).then(parseCommentTotal);
  }
  return getVoiceComments({ id: resource.id, limit: 1, offset: 0 }).then(parseCommentTotal);
}

function propagateSongStats(songId: number, stats: SongStats) {
  if (stats.likedCount == null && stats.commentCount == null) return;

  useUserStore.getState().mergeSongStats(songId, stats);

  const player = usePlayerStore.getState();
  if (player.currentSongDetail?.id === songId) {
    usePlayerStore.setState({
      currentSongDetail: { ...player.currentSongDetail, ...stats },
    });
  }

  const patchQueue = (list: SongDetail[]) =>
    list.map((song) => (song.id === songId ? { ...song, ...stats } : song));

  if (player.queue.some((song) => song.id === songId)) {
    usePlayerStore.setState({
      queue: patchQueue(player.queue),
      originalQueue: patchQueue(player.originalQueue),
    });
  }
}

const enricher = createSongStatsEnricher({
  loader: {
    getCommentCount: loadCommentCount,
    getLikedCount: loadLikedCount,
  },
  propagateSongStats,
  reportFailure,
});

export const {
  enrichSongStatsById,
  enrichSongsStats,
  getSongStatsEnrichmentState,
  subscribeSongStatsEnrichment,
  songNeedsStatsEnrichment,
} = enricher;

export { propagateSongStats };
