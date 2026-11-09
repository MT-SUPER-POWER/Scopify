/**
 * What a platform can do, named `<area>.<action>` so half a feature (reading comments but not
 * posting) can be declared on its own. The UI asks "is this capability present?" and never
 * compares platform names.
 */
export const MUSIC_CAPABILITIES = [
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
  "recommend.newSongs",
  "recommend.newAlbums",
  "mv",
  "comments.read",
  "comments.write",
  "cloud",
  "podcast",
  "social",
  "messages",
  "vip",
  "history",
  "devices",
] as const;

export type MusicCapability = (typeof MUSIC_CAPABILITIES)[number];
