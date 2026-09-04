import type {
  PlayableSource,
  PlayableSourceAdapterRegistry,
  PlayableSourceCache,
  PlayableSourceResolver,
  PlaybackQuality,
  SourceResolution,
  TrackLocator,
} from "./types";

export interface PlayableSourceResolverClock {
  nowMs(): number;
}

export interface CreatePlayableSourceResolverOptions {
  adapters: PlayableSourceAdapterRegistry;
  cache?: PlayableSourceCache;
  clock?: PlayableSourceResolverClock;
  /** Avoid returning a remote URL about to expire. Defaults to ten seconds. */
  expiryLeewayMs?: number;
}

interface CachedSourceEntry {
  locatorKey: string;
  source: PlayableSource;
}

function cloneSource(source: PlayableSource): PlayableSource {
  return { ...source };
}

function locatorKey(locator: TrackLocator): string {
  return JSON.stringify(locator);
}

function cacheKey(
  locator: TrackLocator,
  quality: PlaybackQuality,
  sessionRevision: number,
): string {
  return `${sessionRevision}:${quality}:${locatorKey(locator)}`;
}

function isRemoteSourceStillUsable(
  source: PlayableSource,
  nowMs: number,
  leewayMs: number,
): boolean {
  return (
    source.kind !== "remote" ||
    source.expiresAtMs === undefined ||
    source.expiresAtMs > nowMs + leewayMs
  );
}

/** In-memory only: signed URLs and local paths must never be persisted by this module. */
class MemoryPlayableSourceCache implements PlayableSourceCache {
  private readonly entries = new Map<string, CachedSourceEntry>();

  clear(): void {
    this.entries.clear();
  }

  get(
    locator: TrackLocator,
    quality: PlaybackQuality,
    sessionRevision: number,
  ): PlayableSource | null {
    const entry = this.entries.get(cacheKey(locator, quality, sessionRevision));
    return entry ? cloneSource(entry.source) : null;
  }

  invalidate(locator: TrackLocator): void {
    const key = locatorKey(locator);
    for (const [cacheEntryKey, entry] of this.entries) {
      if (entry.locatorKey === key) this.entries.delete(cacheEntryKey);
    }
  }

  set(
    locator: TrackLocator,
    quality: PlaybackQuality,
    sessionRevision: number,
    source: PlayableSource,
  ): void {
    this.entries.set(cacheKey(locator, quality, sessionRevision), {
      locatorKey: locatorKey(locator),
      source: cloneSource(source),
    });
  }
}

class DefaultPlayableSourceResolver implements PlayableSourceResolver {
  constructor(
    private readonly adapters: PlayableSourceAdapterRegistry,
    private readonly cache: PlayableSourceCache,
    private readonly clock: PlayableSourceResolverClock,
    private readonly expiryLeewayMs: number,
  ) {}

  invalidate(locator: TrackLocator): void {
    this.cache.invalidate(locator);
  }

  async resolve(
    item: Parameters<PlayableSourceResolver["resolve"]>[0],
    request: Parameters<PlayableSourceResolver["resolve"]>[1],
  ): Promise<SourceResolution> {
    if (request.signal.aborted)
      return { reason: "resolution-aborted", retryable: false, status: "unavailable" };

    const cached = this.cache.get(item.locator, request.quality, request.sessionRevision);
    if (cached) {
      if (request.excludedCandidateIds.includes(cached.candidateId)) {
        this.cache.invalidate(item.locator);
      } else if (isRemoteSourceStillUsable(cached, this.clock.nowMs(), this.expiryLeewayMs)) {
        return { source: cached, status: "resolved" };
      } else {
        this.cache.invalidate(item.locator);
      }
    }

    const adapter = this.adapters[item.locator.kind];
    if (!adapter) {
      return {
        reason: `${item.locator.kind}-source-not-supported`,
        status: "unsupported",
      };
    }

    let resolution: SourceResolution;
    try {
      resolution = await adapter.resolve(item.locator, request);
    } catch {
      return { reason: "source-adapter-failed", retryable: true, status: "unavailable" };
    }

    if (request.signal.aborted)
      return { reason: "resolution-aborted", retryable: false, status: "unavailable" };
    if (resolution.status !== "resolved") return resolution;

    if (request.excludedCandidateIds.includes(resolution.source.candidateId)) {
      return { reason: "source-candidate-excluded", retryable: false, status: "unavailable" };
    }

    if (!isRemoteSourceStillUsable(resolution.source, this.clock.nowMs(), this.expiryLeewayMs)) {
      return { reason: "source-expired", retryable: true, status: "unavailable" };
    }

    this.cache.set(item.locator, request.quality, request.sessionRevision, resolution.source);
    return { source: cloneSource(resolution.source), status: "resolved" };
  }
}

export function createMemoryPlayableSourceCache(): PlayableSourceCache {
  return new MemoryPlayableSourceCache();
}

export function createPlayableSourceResolver(
  options: CreatePlayableSourceResolverOptions,
): PlayableSourceResolver {
  return new DefaultPlayableSourceResolver(
    options.adapters,
    options.cache ?? new MemoryPlayableSourceCache(),
    options.clock ?? { nowMs: () => Date.now() },
    options.expiryLeewayMs ?? 10_000,
  );
}
