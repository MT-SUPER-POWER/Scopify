import type { MusicCapability } from "@scopify/music-domain/capability";
import type { MusicProviderClient } from "@scopify/music-domain/provider";

import { qqAlbumSource } from "@/lib/providers/qq/album";
import { qqArtistSource } from "@/lib/providers/qq/artist";
import { qqLibrarySource } from "@/lib/providers/qq/library";
import { qqPlaybackSource } from "@/lib/providers/qq/playback";
import { qqPlaylistSource } from "@/lib/providers/qq/playlist";
import { qqSearchSource } from "@/lib/providers/qq/search";
import { qqRecommendSource } from "@/lib/providers/qq/recommend";
import { qqTrackSource } from "@/lib/providers/qq/track";

/** Grows as each area is migrated; a capability is declared once its pages work on QQ. */
const QQ_CAPABILITIES: ReadonlySet<MusicCapability> = new Set<MusicCapability>([
  "track.read",
  "track.play",
  "playlist.read",
  "search",
  "home",
  "recommend.daily",
  "recommend.fm",
  "recommend.playlists",
  "recommend.toplists",
  "recommend.newSongs",
  "library.playlists",
  "track.like",
  "playlist.manage",
]);

/** Composed from one module per area (`./<area>.ts`), so areas can change independently. */
export const qqProvider: MusicProviderClient = {
  provider: "qq",
  capabilities: QQ_CAPABILITIES,
  ...qqTrackSource,
  ...qqPlaybackSource,
  ...qqPlaylistSource,
  ...qqSearchSource,
  ...qqArtistSource,
  ...qqAlbumSource,
  ...qqRecommendSource,
  ...qqLibrarySource,
};
