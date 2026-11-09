import type { MusicCapability } from "@scopify/music-domain/capability";
import type { MusicProviderClient } from "@scopify/music-domain/provider";

import { neteaseCommentSource } from "@/lib/providers/netease/comment";
import { neteaseMvSource } from "@/lib/providers/netease/mv";
import { neteaseLibrarySource } from "@/lib/providers/netease/library";
import { neteaseLyricsSource } from "@/lib/providers/netease/lyrics";
import { neteaseAlbumSource } from "@/lib/providers/netease/album";
import { neteaseArtistSource } from "@/lib/providers/netease/artist";
import { neteasePlaybackSource } from "@/lib/providers/netease/playback";
import { neteasePlaylistSource } from "@/lib/providers/netease/playlist";
import { neteaseSearchSource } from "@/lib/providers/netease/search";
import { neteaseRecommendSource } from "@/lib/providers/netease/recommend";
import { neteaseTrackSource } from "@/lib/providers/netease/track";

/** Every existing page is built on NetEase, so it declares every capability. */
const NETEASE_CAPABILITIES: ReadonlySet<MusicCapability> = new Set<MusicCapability>([
  "track.read",
  "track.play",
  "track.lyrics",
  "track.like",
  "search",
  "search.overview",
  "search.lyrics",
  "track.sheet",
  "playlist.read",
  "playlist.manage",
  "playlist.reorder",
  "library.playlists",
  "artist.read",
  "artist.follow",
  "album.read",
  "album.subscribe",
  "home",
  "home.banners",
  "recommend.daily",
  "recommend.daily.styles",
  "recommend.fm",
  "recommend.fm.modes",
  "recommend.fm.dislike",
  "recommend.playlists",
  "recommend.toplists",
  "recommend.artists",
  "recommend.newSongs",
  "recommend.newAlbums",
  "mv",
  "mv.interact",
  "comments.read",
  "comments.write",
  "comments.replies",
  "cloud",
  "podcast",
  "social",
  "messages",
  "vip",
  "history",
  "devices",
]);

/** Composed from one module per area (`./<area>.ts`), so areas can change independently. */
export const neteaseProvider: MusicProviderClient = {
  provider: "netease",
  capabilities: NETEASE_CAPABILITIES,
  ...neteaseTrackSource,
  ...neteasePlaybackSource,
  ...neteasePlaylistSource,
  ...neteaseSearchSource,
  ...neteaseArtistSource,
  ...neteaseAlbumSource,
  ...neteaseRecommendSource,
  ...neteaseLibrarySource,
  ...neteaseLyricsSource,
  ...neteaseCommentSource,
  ...neteaseMvSource,
};
