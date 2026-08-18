import type { SongDetail, SongStats } from "@/types/api/music";
import type { SongStatsEnrichmentState, SongStatsLoadResult } from "@/types/songStats";

export type SongStatsResource = { kind: "song"; id: number } | { kind: "voice"; id: number };

export interface SongStatsLoader {
  getCommentCount: (resource: SongStatsResource) => Promise<number | undefined>;
  getLikedCount: (resource: SongStatsResource) => Promise<number | undefined>;
}

export interface SongStatsFailure {
  context: unknown;
  error: unknown;
  event: "song.stats_enrichment_failed";
  message: string;
  source: "transport";
}

export interface SongStatsEnricher {
  enrichSongStatsById: (
    songId: number,
    existing?: SongStats,
    voiceId?: number,
  ) => Promise<SongStatsEnrichmentState>;
  enrichSongsStats: (
    songs: SongDetail[],
    onUpdate: (songId: number, stats: SongStats) => void,
  ) => void;
  getSongStatsEnrichmentState: (songId: number | null) => SongStatsEnrichmentState;
  propagateSongStats: (songId: number, stats: SongStats) => void;
  subscribeSongStatsEnrichment: (listener: () => void) => () => boolean;
  songNeedsStatsEnrichment: (
    song: Pick<SongDetail, "id" | "likedCount" | "commentCount">,
  ) => boolean;
}

export interface CreateSongStatsEnricherOptions {
  loader: SongStatsLoader;
  propagateSongStats: (songId: number, stats: SongStats) => void;
  reportFailure: (failure: SongStatsFailure) => void;
  retryAttempts?: number;
  retryDelayMs?: number;
}

const ENRICH_CONCURRENCY = 4;
const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 150;

export function createSongStatsEnricher({
  loader,
  propagateSongStats,
  reportFailure,
  retryAttempts = DEFAULT_RETRY_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
}: CreateSongStatsEnricherOptions): SongStatsEnricher {
  const statsCache = new Map<number, SongStats>();
  const statsRequests = new Map<number, Promise<SongStatsEnrichmentState>>();
  const statsStates = new Map<number, SongStatsEnrichmentState>();
  const statsStateListeners = new Set<() => void>();
  const emptyStatsState: SongStatsEnrichmentState = { stats: {}, status: "idle" };
  const attempts = Math.max(1, Math.floor(retryAttempts));
  const delay = Math.max(0, retryDelayMs);

  const notifyStatsStateListeners = () => {
    statsStateListeners.forEach((listener) => listener());
  };

  const setSongStatsEnrichmentState = (songId: number, state: SongStatsEnrichmentState) => {
    statsStates.set(songId, state);
    notifyStatsStateListeners();
  };

  const toSongStats = (likedCount?: number, commentCount?: number): SongStats => ({
    ...(likedCount === undefined ? {} : { likedCount }),
    ...(commentCount === undefined ? {} : { commentCount }),
  });

  const mergeSongStats = (existing?: SongStats, cached?: SongStats): SongStats =>
    toSongStats(
      existing?.likedCount ?? cached?.likedCount,
      existing?.commentCount ?? cached?.commentCount,
    );

  const getMissingStatNames = (stats: SongStats) =>
    [
      ...(stats.likedCount === undefined ? ["likedCount"] : []),
      ...(stats.commentCount === undefined ? ["commentCount"] : []),
    ] as const;

  const waitForStatsRetry = () =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, delay);
    });

  const loadStatistic = async (
    request: () => Promise<number | undefined>,
  ): Promise<SongStatsLoadResult> => {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const value = await request();
        if (value !== undefined) return { value };
        lastError = new Error("Song statistic response did not include a usable count");
      } catch (error) {
        lastError = error;
      }

      if (attempt < attempts) await waitForStatsRetry();
    }

    return { error: lastError };
  };

  const songNeedsStatsEnrichment = (
    song: Pick<SongDetail, "id" | "likedCount" | "commentCount">,
  ) => {
    const cached = statsCache.get(song.id);
    const hasLiked = song.likedCount != null || cached?.likedCount != null;
    const hasComment = song.commentCount != null || cached?.commentCount != null;
    return !hasLiked || !hasComment;
  };

  const loadSongStats = async (
    songId: number,
    existing?: SongStats,
    voiceId?: number,
  ): Promise<SongStatsEnrichmentState> => {
    const cached = statsCache.get(songId);
    const initialStats = mergeSongStats(existing, cached);
    const needsLiked = initialStats.likedCount === undefined;
    const needsComment = initialStats.commentCount === undefined;
    const resource: SongStatsResource =
      voiceId === undefined ? { kind: "song", id: songId } : { kind: "voice", id: voiceId };

    if (!needsLiked && !needsComment) {
      return { stats: initialStats, status: "complete" };
    }

    const [liked, comments]: [SongStatsLoadResult, SongStatsLoadResult] = await Promise.all([
      needsLiked
        ? loadStatistic(() => loader.getLikedCount(resource))
        : Promise.resolve({ value: initialStats.likedCount }),
      needsComment
        ? loadStatistic(() => loader.getCommentCount(resource))
        : Promise.resolve({ value: initialStats.commentCount }),
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
  };

  const enrichSongStatsById = (
    songId: number,
    existing?: SongStats,
    voiceId?: number,
  ): Promise<SongStatsEnrichmentState> => {
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
    const request = loadSongStats(songId, resolvedStats, voiceId)
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
  };

  const enrichSongsStats = (
    songs: SongDetail[],
    onUpdate: (songId: number, stats: SongStats) => void,
  ) => {
    const pending = songs.filter(songNeedsStatsEnrichment);
    if (!pending.length) return;

    let active = 0;
    let index = 0;

    const runNext = () => {
      while (active < ENRICH_CONCURRENCY && index < pending.length) {
        const song = pending[index++];
        active += 1;

        void enrichSongStatsById(
          song.id,
          {
            likedCount: song.likedCount,
            commentCount: song.commentCount,
          },
          song.voiceId,
        )
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
  };

  return {
    enrichSongStatsById,
    enrichSongsStats,
    getSongStatsEnrichmentState: (songId: number | null) =>
      songId === null ? emptyStatsState : (statsStates.get(songId) ?? emptyStatsState),
    propagateSongStats,
    subscribeSongStatsEnrichment: (listener: () => void) => {
      statsStateListeners.add(listener);
      return () => statsStateListeners.delete(listener);
    },
    songNeedsStatsEnrichment,
  };
}
