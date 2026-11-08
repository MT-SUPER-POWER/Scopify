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
  "history",
  "devices",
] as const;

export type MusicCapability = (typeof MUSIC_CAPABILITIES)[number];
