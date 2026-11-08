import type { MusicCapability } from "./capability";
import type { MusicProvider } from "./identity";
import type { MusicPlaybackSource } from "./playback";
import type { MusicTrack } from "./track";

/** Track lookup, implemented by every platform. */
export interface MusicTrackSource {
  /** Tracks for native IDs, in request order; IDs the platform cannot resolve are left out. */
  getTracks(ids: readonly string[], signal?: AbortSignal): Promise<MusicTrack[]>;
}

/**
 * One platform behind the interface types. Pages and hooks call these methods and never a
 * platform's own API. Each migrated area adds its own `Music<Area>Source` interface next to
 * its types and lists it here; a method only some platforms have is optional and guarded by a
 * capability. Work only one platform has stays out and is reached behind a capability check.
 */
export interface MusicProviderClient extends MusicTrackSource, MusicPlaybackSource {
  readonly provider: MusicProvider;
  readonly capabilities: ReadonlySet<MusicCapability>;
}
