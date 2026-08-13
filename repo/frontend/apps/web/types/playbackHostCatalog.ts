import type { PlaybackQueueEntry } from "@mt-super-power/desktop-contract";

import type { NeteaseLyric } from "@/types/api/music";
import type { PlaybackSourceRequest } from "@/lib/playbackHost/catalog";
import type { MusicQuality } from "@/types/player";

/** The material the Host must apply together for one playable queue entry. */
export interface ResolvedPlaybackSource {
  durationMs: number;
  lyrics: NeteaseLyric | null;
  sourceUrl: string;
}

/** Resolves a concrete queue entry without reading renderer state. */
export interface PlaybackSourceResolver {
  /** Removes an expiring/failed source before the next resolve of this entry. */
  invalidate?(entry: PlaybackQueueEntry, quality: MusicQuality, signal: AbortSignal): Promise<void>;
  resolve(
    entry: PlaybackQueueEntry,
    quality: MusicQuality,
    signal: AbortSignal,
  ): Promise<ResolvedPlaybackSource>;
}

/** Supplies Host-owned queue metadata for a generic Runtime source request. */
export interface ResolvePlaybackSourceRequest {
  request: PlaybackSourceRequest<NeteaseLyric>;
  signal: AbortSignal;
}

/** Atomically applies one resolved source into the Host media/session adapter. */
export interface ApplyResolvedPlaybackSource {
  isCurrent(): boolean;
  request: PlaybackSourceRequest<NeteaseLyric>;
  resolved: ResolvedPlaybackSource;
  signal: AbortSignal;
}

export interface PlaybackCatalogPortOptions {
  applyResolvedSource(input: ApplyResolvedPlaybackSource): boolean | Promise<boolean>;
  invalidateSource?(request: ResolvePlaybackSourceRequest): void | Promise<void>;
  resolve(request: ResolvePlaybackSourceRequest): Promise<ResolvedPlaybackSource>;
}
