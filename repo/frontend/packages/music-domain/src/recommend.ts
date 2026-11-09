import type { MusicResourceRef } from "./identity";
import type { MusicPlaylist } from "./playlist";
import type { MusicArtist, MusicTrack } from "./track";

/** One entry of a chart's top list, for the card that previews the chart. */
export interface MusicToplistPreviewEntry {
  rank: number;
  title: string;
  artist: string;
}

/**
 * A chart. It opens and plays like a playlist: `ref` is a playlist reference that the
 * platform's `getPlaylist` and `getPlaylistTracks` accept.
 */
export interface MusicToplist {
  ref: MusicResourceRef<"playlist">;
  title: string;
  coverUrl: string | null;
  /** How often the chart updates, as the platform words it ("every day"); null when unknown. */
  updateFrequency: string | null;
  /** The first few entries, when the platform lists them with the charts. */
  preview: readonly MusicToplistPreviewEntry[];
}

/** An artist as the home page offers one: a name and a picture to open the artist from. */
export interface MusicFeaturedArtist {
  ref: MusicResourceRef<"artist">;
  name: string;
  /** Null when the platform has no picture for the artist. */
  avatarUrl: string | null;
}

/** One card on a feed shelf: a song to play or a playlist to open. */
export type MusicFeedItem =
  { kind: "track"; track: MusicTrack } | { kind: "playlist"; playlist: MusicPlaylist };

/**
 * A shelf of the platform's own home feed. The platform decides what it holds and what it is
 * called; `title` is already filled in, so callers show it as it is.
 */
export interface MusicFeedShelf {
  id: string;
  title: string;
  items: readonly MusicFeedItem[];
}

/** An album as a release shelf shows it. */
export interface MusicAlbumSummary {
  ref: MusicResourceRef<"album">;
  title: string;
  coverUrl: string | null;
  artists: readonly MusicArtist[];
  /** Release time in milliseconds since the epoch, when the platform reports one. */
  publishedAt: number | null;
}

/** Which stream the personal FM should draw from. Platforms without modes ignore it. */
export interface MusicPersonalFmRequest {
  /** A mode the platform names (`recommend.fm.modes`); absent means the default stream. */
  mode?: string;
  scene?: string;
  signal?: AbortSignal;
}

export interface MusicDailyTracksRequest {
  /** A past day as `YYYY-MM-DD`; platforms that keep no history ignore it and serve today. */
  date?: string;
  signal?: AbortSignal;
}

export interface MusicRecommendReadOptions {
  signal?: AbortSignal;
}

/**
 * What the home page and the recommendation pages read. Every method is optional: a platform
 * implements the ones it has and declares the matching capability, and callers only call a
 * method after checking it (`recommend.daily`, `recommend.fm`, `recommend.playlists`,
 * `recommend.toplists`, `recommend.artists`, `recommend.feed`, `recommend.newSongs`, `recommend.newAlbums`).
 */
export interface MusicRecommendSource {
  /** Today's songs picked for the signed-in account. */
  getDailyTracks?(request?: MusicDailyTracksRequest): Promise<MusicTrack[]>;
  /** The next batch of the signed-in account's personal FM; a repeat call serves more songs. */
  getPersonalFmTracks?(request?: MusicPersonalFmRequest): Promise<MusicTrack[]>;
  /** Tells the platform the account does not want this FM song (`recommend.fm.dislike`). */
  dislikePersonalFmTrack?(track: MusicResourceRef<"track">): Promise<void>;
  /** Playlists anyone gets, with no account needed. */
  getFeaturedPlaylists?(
    limit: number,
    options?: MusicRecommendReadOptions,
  ): Promise<MusicPlaylist[]>;
  /** Playlists picked for the signed-in account. */
  getRecommendedPlaylists?(options?: MusicRecommendReadOptions): Promise<MusicPlaylist[]>;
  getToplists?(options?: MusicRecommendReadOptions): Promise<MusicToplist[]>;
  /** The platform's own home feed, shelf by shelf (`recommend.feed`); needs an account. */
  getHomeFeed?(options?: MusicRecommendReadOptions): Promise<MusicFeedShelf[]>;
  /** Artists worth opening from the home page, most popular first; no account needed. */
  getFeaturedArtists?(
    limit: number,
    options?: MusicRecommendReadOptions,
  ): Promise<MusicFeaturedArtist[]>;
  getNewTracks?(limit: number, options?: MusicRecommendReadOptions): Promise<MusicTrack[]>;
  getNewAlbums?(limit: number, options?: MusicRecommendReadOptions): Promise<MusicAlbumSummary[]>;
}
