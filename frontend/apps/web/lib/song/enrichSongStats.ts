import { getMusicComments } from "@/lib/api/comment";
import { getSongRedCount } from "@/lib/api/track";
import { usePlayerStore, useUserStore } from "@/store";
import type { SongDetail, SongStats } from "@/types/api/music";

const statsCache = new Map<number, SongStats>();
const ENRICH_CONCURRENCY = 4;

function parseRedCount(
  res: Awaited<ReturnType<typeof getSongRedCount>> | null,
): number | undefined {
  const body = res?.data;
  if (body?.code !== 200) return undefined;
  const count = body.data?.count ?? body.data?.likedCount;
  return typeof count === "number" && count >= 0 ? count : undefined;
}

function parseCommentTotal(
  res: Awaited<ReturnType<typeof getMusicComments>> | null,
): number | undefined {
  const total = res?.data?.total;
  return typeof total === "number" && total >= 0 ? total : undefined;
}

export function songNeedsStatsEnrichment(
  song: Pick<SongDetail, "id" | "likedCount" | "commentCount">,
) {
  const cached = statsCache.get(song.id);
  const hasLiked = song.likedCount != null || cached?.likedCount != null;
  const hasComment = song.commentCount != null || cached?.commentCount != null;
  return !hasLiked || !hasComment;
}

export async function fetchSongStats(songId: number, existing?: SongStats): Promise<SongStats> {
  const cached = statsCache.get(songId);
  const needsLiked = existing?.likedCount == null && cached?.likedCount == null;
  const needsComment = existing?.commentCount == null && cached?.commentCount == null;

  if (!needsLiked && !needsComment) {
    return { ...cached, ...existing };
  }

  const [redRes, commentRes] = await Promise.all([
    needsLiked ? getSongRedCount(songId).catch(() => null) : Promise.resolve(null),
    needsComment
      ? getMusicComments({ id: songId, limit: 1, offset: 0 }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const stats: SongStats = {
    likedCount: existing?.likedCount ?? cached?.likedCount ?? parseRedCount(redRes),
    commentCount: existing?.commentCount ?? cached?.commentCount ?? parseCommentTotal(commentRes),
  };

  statsCache.set(songId, { ...statsCache.get(songId), ...stats });
  return stats;
}

export function propagateSongStats(songId: number, stats: SongStats) {
  if (stats.likedCount == null && stats.commentCount == null) return;

  useUserStore.getState().mergeSongStats(songId, stats);

  const player = usePlayerStore.getState();
  if (player.currentSongDetail?.id === songId) {
    usePlayerStore.setState({
      currentSongDetail: { ...player.currentSongDetail, ...stats },
    });
  }

  const patchQueue = (list: SongDetail[]) =>
    list.map((s) => (s.id === songId ? { ...s, ...stats } : s));

  if (player.queue.some((s) => s.id === songId)) {
    usePlayerStore.setState({
      queue: patchQueue(player.queue),
      originalQueue: patchQueue(player.originalQueue),
    });
  }
}

/** 后台批量补全歌曲点赞/评论数，每首完成后触发 onUpdate */
export function enrichSongsStats(
  songs: SongDetail[],
  onUpdate: (songId: number, stats: SongStats) => void,
) {
  const pending = songs.filter(songNeedsStatsEnrichment);
  if (!pending.length) return;

  let active = 0;
  let index = 0;

  const runNext = () => {
    while (active < ENRICH_CONCURRENCY && index < pending.length) {
      const song = pending[index++];
      active += 1;

      void fetchSongStats(song.id, {
        likedCount: song.likedCount,
        commentCount: song.commentCount,
      })
        .then((stats) => {
          if (stats.likedCount != null || stats.commentCount != null) {
            onUpdate(song.id, stats);
            propagateSongStats(song.id, stats);
          }
        })
        .finally(() => {
          active -= 1;
          runNext();
        });
    }
  };

  runNext();
}

/** 单首歌曲补全（播放时按需触发） */
export async function enrichSongStatsById(songId: number, existing?: SongStats) {
  if (!songNeedsStatsEnrichment({ id: songId, ...existing }))
    return existing ?? statsCache.get(songId);

  const stats = await fetchSongStats(songId, existing);
  propagateSongStats(songId, stats);
  return stats;
}
