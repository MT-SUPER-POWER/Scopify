import type { MusicPlaylist } from "./playlist";
import type { MusicAlbum, MusicArtist, MusicTrack } from "./track";

/** What a search can look for. Each kind comes back as its own list, paged on its own. */
export type MusicSearchKind = "song" | "artist" | "album" | "playlist";

/** An artist as a search result: the shared artist plus what a result card shows. */
export interface MusicArtistResult extends MusicArtist {
  /** Null when the platform has no picture for the artist, never an invented address. */
  avatarUrl: string | null;
  /** Other names the artist goes by. */
  aliases: readonly string[];
}

/** An artist credited on a result. A platform that only names the artist leaves `ref` null. */
export interface MusicCreditedArtist {
  ref: MusicArtist["ref"] | null;
  name: string;
}

/** An album as a search result: the shared album plus who made it and when. */
export interface MusicAlbumResult extends MusicAlbum {
  artists: readonly MusicCreditedArtist[];
  /** Release time in milliseconds since the epoch; null when the platform does not say. */
  publishedAt: number | null;
}

/** What each kind of search returns. Songs are the shared track, playlists the shared card. */
export interface MusicSearchResultMap {
  song: MusicTrack;
  artist: MusicArtistResult;
  album: MusicAlbumResult;
  playlist: MusicPlaylist;
}

export interface MusicSearchRequest<Kind extends MusicSearchKind = MusicSearchKind> {
  keyword: string;
  kind: Kind;
  /** Results to skip. A platform with fixed page sizes may only accept multiples of its size. */
  offset: number;
  /** Results wanted; a platform serving fewer per page returns its own page size. */
  limit: number;
}

/** Results from `offset` on, with where the next page starts, or null at the end of the results. */
export interface MusicSearchPage<Item> {
  offset: number;
  items: Item[];
  nextOffset: number | null;
}

/** A part of a suggestion, in order, so the part that matched the input can be emphasised. */
export interface MusicSearchHighlight {
  text: string;
  matched: boolean;
}

/** A label or badge the platform attaches to a suggestion. */
export interface MusicSearchSuggestionTag {
  label: string | null;
  imageUrl: string | null;
  /** The platform marks the label as a highlighted one. */
  emphasized: boolean;
}

/** A keyword offered while typing. Searching for it is a search for `keyword`. */
export interface MusicSearchSuggestion {
  keyword: string;
  highlights: readonly MusicSearchHighlight[];
  tag: MusicSearchSuggestionTag | null;
}

/** A keyword offered while the search box is empty. */
export interface MusicHotSearch {
  keyword: string;
}

/** The single best result of an overview, ranked above the lists. */
export type MusicSearchBestMatch =
  | { kind: "song"; song: MusicTrack }
  | { kind: "artist"; artist: MusicArtistResult }
  | { kind: "album"; album: MusicAlbumResult }
  | { kind: "playlist"; playlist: MusicPlaylist };

/** The first results of every kind from one request, with the platform's best match. */
export interface MusicSearchOverview {
  bestMatch: MusicSearchBestMatch | null;
  songs: MusicTrack[];
  artists: MusicArtistResult[];
  albums: MusicAlbumResult[];
  playlists: MusicPlaylist[];
}

/**
 * Keyword search, implemented by every platform with the `search` capability. The overview is
 * optional and present with `search.overview`: platforms without it get their overview page
 * from one search per kind.
 */
export interface MusicSearchSource {
  search<Kind extends MusicSearchKind>(
    request: MusicSearchRequest<Kind>,
    signal?: AbortSignal,
  ): Promise<MusicSearchPage<MusicSearchResultMap[Kind]>>;
  /** Keywords to show while the box is empty. */
  getHotSearches(signal?: AbortSignal): Promise<MusicHotSearch[]>;
  /** Completions for a half-typed keyword; empty when the platform has none. */
  getSearchSuggestions(keyword: string, signal?: AbortSignal): Promise<MusicSearchSuggestion[]>;
  searchOverview?(keyword: string, signal?: AbortSignal): Promise<MusicSearchOverview>;
  /**
   * The platform's direct hit for a keyword, for platforms whose lists are searched one kind at
   * a time (`search.match`); null when the keyword matches nothing outright.
   */
  getSearchBestMatch?(keyword: string, signal?: AbortSignal): Promise<MusicSearchBestMatch | null>;
}
