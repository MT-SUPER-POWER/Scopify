import type { MusicCapability } from "@scopify/music-domain/capability";
import type { MusicProviderClient } from "@scopify/music-domain/provider";

import { neteaseTrackSource } from "@/lib/providers/netease/track";

/** Every existing page is built on NetEase, so it declares every capability. */
const NETEASE_CAPABILITIES: ReadonlySet<MusicCapability> = new Set<MusicCapability>([
  "track.read",
  "track.play",
  "track.lyrics",
  "track.like",
  "search",
  "playlist.read",
  "playlist.manage",
  "playlist.reorder",
  "library.playlists",
  "artist.read",
  "album.read",
  "recommend.daily",
  "recommend.fm",
  "mv",
  "comments.read",
  "comments.write",
  "cloud",
  "podcast",
  "social",
  "messages",
  "vip",
]);

/** Composed from one module per area (`./<area>.ts`), so areas can change independently. */
export const neteaseProvider: MusicProviderClient = {
  provider: "netease",
  capabilities: NETEASE_CAPABILITIES,
  ...neteaseTrackSource,
};
