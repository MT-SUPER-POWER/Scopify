import {
  createPlayableSourceResolver,
  type PlayableSourceAdapter,
  type PlayableSourceResolver,
  type PlaybackQuality,
  type SourceResolution,
  type TrackLocator,
} from "@scopify/playback-core";

import { getSongUrlWithQuality, UI_QUALITY_TO_LEVEL } from "@/lib/api/music";
import {
  clearCachedPlayUrl,
  getCachedPlayUrl,
  setCachedPlayUrl,
  setCachedReplayGain,
} from "@/lib/cache/playbackCache";
import type { MusicQualityLevel } from "@/types/api/music";
import type { MusicQuality } from "@/types/player";

/**
 * The playback core deliberately uses runtime-neutral quality names. Keep the
 * NetEase API vocabulary here so neither the queue nor PlaybackSession learns
 * about the backend's `jymaster` / `exhigh` naming.
 */
const PLAYBACK_QUALITY_TO_MUSIC_QUALITY: Record<PlaybackQuality, MusicQuality> = {
  dolby: "dolby",
  high: "high",
  hires: "hires",
  lossless: "lossless",
  master: "jymaster",
  sky: "sky",
  spatial: "spatial",
  standard: "standard",
};

// The persisted cache is governed by the user's playback URL TTL. The core
// cache is deliberately much shorter so it only coalesces nearby resolves and
// never becomes a second long-lived signed-URL cache in this compatibility phase.
const CORE_MEMORY_SOURCE_TTL_MS = 60_000;

export interface NeteasePlayableSourceAdapterDependencies {
  clearCachedPlayUrl(songId: number, quality: MusicQuality): Promise<void>;
  getCachedPlayUrl(songId: number, quality: MusicQuality): Promise<string | null>;
  getSongUrlWithQuality(
    songId: number,
    level: MusicQualityLevel,
  ): Promise<{
    data: string | null | undefined;
    replayGainTrackGain?: number;
  }>;
  setCachedPlayUrl(songId: number, quality: MusicQuality, url: string): Promise<void>;
  setCachedReplayGain(songId: number, gainDb: number): Promise<void>;
}

const defaultDependencies: NeteasePlayableSourceAdapterDependencies = {
  clearCachedPlayUrl,
  getCachedPlayUrl,
  getSongUrlWithQuality,
  setCachedPlayUrl,
  setCachedReplayGain,
};

function toSongId(locator: TrackLocator): number | null {
  if (locator.kind !== "netease") return null;
  const songId = Number(locator.songId);
  return Number.isSafeInteger(songId) && songId > 0 ? songId : null;
}

function candidateId(songId: number, quality: PlaybackQuality): string {
  return `netease:${songId}:${quality}`;
}

function unavailable(reason: string, retryable: boolean): SourceResolution {
  return { reason, retryable, status: "unavailable" };
}

/**
 * Web's NetEase source adapter owns the legacy persistent signed-URL cache.
 *
 * The shared resolver adds only a short-lived in-memory layer. Persisting a
 * signed URL remains a Web concern because it is backed by Browser IndexedDB
 * or the Desktop renderer's scoped-cache IPC; neither is available to the
 * runtime-neutral playback core.
 */
export class NeteasePlayableSourceAdapter implements PlayableSourceAdapter {
  constructor(private readonly dependencies: NeteasePlayableSourceAdapterDependencies) {}

  async invalidate(locator: TrackLocator, quality: PlaybackQuality): Promise<void> {
    const songId = toSongId(locator);
    if (songId === null) return;
    await this.dependencies.clearCachedPlayUrl(songId, PLAYBACK_QUALITY_TO_MUSIC_QUALITY[quality]);
  }

  async resolve(
    locator: TrackLocator,
    request: Parameters<PlayableSourceAdapter["resolve"]>[1],
  ): Promise<SourceResolution> {
    const songId = toSongId(locator);
    if (songId === null) {
      return locator.kind === "netease"
        ? { reason: "invalid-netease-song-id", status: "unavailable", retryable: false }
        : { reason: `${locator.kind}-source-not-supported`, status: "unsupported" };
    }
    if (request.signal.aborted) return unavailable("resolution-aborted", false);

    const quality = PLAYBACK_QUALITY_TO_MUSIC_QUALITY[request.quality];
    const id = candidateId(songId, request.quality);
    try {
      const cachedUrl = await this.dependencies.getCachedPlayUrl(songId, quality);
      if (request.signal.aborted) return unavailable("resolution-aborted", false);
      if (cachedUrl && !request.excludedCandidateIds.includes(id)) {
        return {
          source: {
            candidateId: id,
            expiresAtMs: Date.now() + CORE_MEMORY_SOURCE_TTL_MS,
            kind: "remote",
            quality: request.quality,
            url: cachedUrl,
          },
          status: "resolved",
        };
      }

      const result = await this.dependencies.getSongUrlWithQuality(
        songId,
        UI_QUALITY_TO_LEVEL[quality],
      );
      if (request.signal.aborted) return unavailable("resolution-aborted", false);
      if (!result.data || request.excludedCandidateIds.includes(id)) {
        return unavailable(
          result.data ? "netease-source-candidate-excluded" : "netease-playable-source-unavailable",
          false,
        );
      }

      // Cache writes are intentionally completed before resolving. The player
      // may read ReplayGain immediately after source resolution without a
      // second request or a metadata side-channel in PlayableSource.
      await Promise.all([
        this.dependencies.setCachedPlayUrl(songId, quality, result.data),
        result.replayGainTrackGain === undefined
          ? Promise.resolve()
          : this.dependencies.setCachedReplayGain(songId, result.replayGainTrackGain),
      ]);
      if (request.signal.aborted) return unavailable("resolution-aborted", false);

      return {
        source: {
          candidateId: id,
          expiresAtMs: Date.now() + CORE_MEMORY_SOURCE_TTL_MS,
          kind: "remote",
          quality: request.quality,
          url: result.data,
        },
        status: "resolved",
      };
    } catch {
      // Do not include the backend response or signed URL in an error: this
      // result is safe to surface in a future MCP/UI diagnostic.
      return unavailable("netease-source-request-failed", true);
    }
  }
}

export interface WebNeteasePlayableSourceResolver {
  /** Clears both core's in-memory source and the renderer's persistent URL. */
  invalidate(songId: number, quality: MusicQuality): Promise<void>;
  resolve(songId: number, quality: MusicQuality, signal?: AbortSignal): Promise<SourceResolution>;
}

function toPlaybackQuality(quality: MusicQuality): PlaybackQuality {
  if (quality === "jymaster") return "master";
  return quality;
}

function createAbortSignal(): AbortSignal {
  return new AbortController().signal;
}

/**
 * Compatibility façade for the current Zustand-owned queue/session.
 *
 * It lets the existing player store obtain a `PlayableSource` without knowing
 * about NetEase URLs or cache keys. It is deliberately not a PlaybackSession:
 * until queue ownership migrates from Zustand there must be exactly one owner
 * of queue selection and load revisions.
 */
export function createWebNeteasePlayableSourceResolver(
  dependencies: NeteasePlayableSourceAdapterDependencies = defaultDependencies,
): WebNeteasePlayableSourceResolver {
  const adapter = new NeteasePlayableSourceAdapter(dependencies);
  const resolver: PlayableSourceResolver = createPlayableSourceResolver({
    adapters: { netease: adapter },
  });

  return {
    async invalidate(songId, quality) {
      const locator: TrackLocator = { kind: "netease", songId: String(songId) };
      resolver.invalidate(locator);
      await adapter.invalidate(locator, toPlaybackQuality(quality));
    },
    resolve(songId, quality, signal = createAbortSignal()) {
      const playbackQuality = toPlaybackQuality(quality);
      return resolver.resolve(
        {
          locator: { kind: "netease", songId: String(songId) },
          // The store owns the real queue identity for this compatibility
          // phase. This synthetic item is used only to enter core's resolver.
          queueItemId: `netease-source:${songId}`,
          track: { artistNames: [], id: String(songId), title: "" },
        },
        {
          excludedCandidateIds: [],
          quality: playbackQuality,
          reason: "initial",
          sessionRevision: 0,
          signal,
        },
      );
    },
  };
}

/** Shared by the Web player store; it does not hold a queue or playback state. */
export const webNeteasePlayableSourceResolver = createWebNeteasePlayableSourceResolver();
