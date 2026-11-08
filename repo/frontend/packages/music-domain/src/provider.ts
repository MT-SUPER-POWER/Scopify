import type { MusicCapability } from "./capability";
import type { MusicProvider } from "./identity";
import type { MusicTrack } from "./track";

/**
 * One platform behind the interface types. Pages and hooks call these methods and never a
 * platform's own API. A method joins this interface when its area is migrated; work only one
 * platform has stays out and is reached behind a capability check.
 */
export interface MusicProviderClient {
  readonly provider: MusicProvider;
  readonly capabilities: ReadonlySet<MusicCapability>;
  /** Tracks for native IDs, in request order; IDs the platform cannot resolve are left out. */
  getTracks(ids: readonly string[], signal?: AbortSignal): Promise<MusicTrack[]>;
}
