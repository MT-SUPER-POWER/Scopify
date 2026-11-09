import type { MusicAlbumSource } from "./album";
import type { MusicArtistSource } from "./artist";
import type { MusicCapability } from "./capability";
import type { MusicProvider } from "./identity";
import type { MusicLibrarySource } from "./library";
import type { MusicLyricsSource } from "./lyrics";
import type { MusicPlaybackSource } from "./playback";
import type { MusicPlaylistSource } from "./playlist";
import type { MusicSearchSource } from "./search";
import type { MusicRecommendSource } from "./recommend";
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
export interface MusicProviderClient
  extends
    MusicTrackSource,
    MusicPlaybackSource,
    MusicPlaylistSource,
    MusicSearchSource,
    MusicRecommendSource,
    MusicLibrarySource,
    MusicArtistSource,
    MusicAlbumSource,
    MusicLyricsSource {
  readonly provider: MusicProvider;
  readonly capabilities: ReadonlySet<MusicCapability>;
}
