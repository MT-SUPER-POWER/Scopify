import { getMusicComments } from "@/lib/api/comment";
import { getSongRedCount } from "@/lib/api/track";
import { usePlayerStore, useUserStore } from "@/store";
import type { SongDetail, SongStats } from "@/types/api/music";
import type { SongStatsEnrichmentState, SongStatsLoadResult } from "@/types/songStats";
import { reportFailure } from "@/lib/web/errorTracking";

const statsCache = new Map<number, SongStats>();
const statsRequests = new Map<number, Promise<SongStatsEnrichmentState>>();
const statsStates = new Map<number, SongStatsEnrichmentState>();
const statsStateListeners = new Set<() => void>();
const ENRICH_CONCURRENCY = 4;
const STATS_REQUEST_ATTEMPTS = 2;
const STATS_RETRY_DELAY_MS = 150;
const EMPTY_STATS_STATE: SongStatsEnrichmentState = { stats: {}, status: "idle" };

function notifyStatsStateListeners() {
  statsStateListeners.forEach((listener) => listener());
}

function setSongStatsEnrichmentState(songId: number, state: SongStatsEnrichmentState) {
  statsStates.set(songId, state);
  notifyStatsStateListeners();
}

function toSongStats(likedCount?: number, commentCount?: number): SongStats {
  return {
    ...(likedCount === undefined ? {} : { likedCount }),
    ...(commentCount === undefined ? {} : { commentCount }),
  };
}

function mergeSongStats(existing?: SongStats, cached?: SongStats): SongStats {
  return toSongStats(
    existing?.likedCount ?? cached?.likedCount,
    existing?.commentCount ?? cached?.commentCount,
  );
}

function getMissingStatNames(stats: SongStats) {
  return [
    ...(stats.likedCount === undefined ? ["likedCount"] : []),
    ...(stats.commentCount === undefined ? ["commentCount"] : []),
  ] as const;
}

function waitForStatsRetry() {
  return new Promise((resolve) => setTimeout(resolve, STATS_RETRY_DELAY_MS));
}

async function loadStatistic<T>(
  request: () => Promise<T>,
  parse: (response: T) => number | undefined,
): Promise<SongStatsLoadResult> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= STATS_REQUEST_ATTEMPTS; attempt += 1) {
    try {
      const value = parse(await request());
      if (value !== undefined) return { value };
      lastError = new Error("Song statistic response did not include a usable count");
    } catch (error) {
      lastError = error;
    }

    if (attempt < STATS_REQUEST_ATTEMPTS) await waitForStatsRetry();
  }

  return { error: lastError };
}

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

function resolveKnownStatistic(value?: number): Promise<SongStatsLoadResult> {
  return Promise.resolve({ value });
}

export function songNeedsStatsEnrichment(
  song: Pick<SongDetail, "id" | "likedCount" | "commentCount">,
) {
  const cached = statsCache.get(song.id);
  const hasLiked = song.likedCount != null || cached?.likedCount != null;
  const hasComment = song.commentCount != null || cached?.commentCount != null;
  return !hasLiked || !hasComment;
}

async function loadSongStats(
  songId: number,
  existing?: SongStats,
): Promise<SongStatsEnrichmentState> {
  const cached = statsCache.get(songId);
  const initialStats = mergeSongStats(existing, cached);
  const needsLiked = initialStats.likedCount === undefined;
  const needsComment = initialStats.commentCount === undefined;

  if (!needsLiked && !needsComment) {
    return { stats: initialStats, status: "complete" };
  }

  const [liked, comments] = await Promise.all([
    needsLiked
      ? loadStatistic(() => getSongRedCount(songId), parseRedCount)
      : resolveKnownStatistic(initialStats.likedCount),
    needsComment
      ? loadStatistic(
          () => getMusicComments({ id: songId, limit: 1, offset: 0 }),
          parseCommentTotal,
        )
      : resolveKnownStatistic(initialStats.commentCount),
  ]);

  const stats = toSongStats(liked.value, comments.value);
  const missingStats = getMissingStatNames(stats);
  const status =
    missingStats.length === 0 ? "complete" : Object.keys(stats).length > 0 ? "partial" : "failed";

  statsCache.set(songId, { ...cached, ...stats });

  if (missingStats.length > 0) {
    reportFailure({
      context: { missingStats, songId },
      error: liked.error ?? comments.error ?? new Error("Song statistics are unavailable"),
      event: "song.stats_enrichment_failed",
      message: "Failed to load song statistics after retrying",
      source: "transport",
    });
  }

  return { stats, status };
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

export function getSongStatsEnrichmentState(songId: number | null): SongStatsEnrichmentState {
  if (songId === null) return EMPTY_STATS_STATE;
  return statsStates.get(songId) ?? EMPTY_STATS_STATE;
}

export function subscribeSongStatsEnrichment(listener: () => void) {
  statsStateListeners.add(listener);
  return () => statsStateListeners.delete(listener);
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

      void enrichSongStatsById(song.id, {
        likedCount: song.likedCount,
        commentCount: song.commentCount,
      })
        .then(({ stats }) => {
          if (stats.likedCount != null || stats.commentCount != null) {
            onUpdate(song.id, stats);
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
export function enrichSongStatsById(songId: number, existing?: SongStats) {
  const cached = statsCache.get(songId);
  const resolvedStats = mergeSongStats(existing, cached);

  if (!songNeedsStatsEnrichment({ id: songId, ...resolvedStats })) {
    const state: SongStatsEnrichmentState = { stats: resolvedStats, status: "complete" };
    statsCache.set(songId, { ...cached, ...resolvedStats });
    propagateSongStats(songId, resolvedStats);
    setSongStatsEnrichmentState(songId, state);
    return Promise.resolve(state);
  }

  const inFlightRequest = statsRequests.get(songId);
  if (inFlightRequest) return inFlightRequest;

  setSongStatsEnrichmentState(songId, { stats: resolvedStats, status: "loading" });
  const request = loadSongStats(songId, resolvedStats)
    .then((state) => {
      propagateSongStats(songId, state.stats);
      setSongStatsEnrichmentState(songId, state);
      return state;
    })
    .finally(() => {
      statsRequests.delete(songId);
    });

  statsRequests.set(songId, request);
  return request;
}
