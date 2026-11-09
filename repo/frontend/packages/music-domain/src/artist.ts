import type { MusicResourceRef } from "./identity";
import type { MusicAlbum, MusicArtist, MusicTrack } from "./track";

/** An artist's own page: the shared artist plus what the header and the about card show. */
export interface MusicArtistDetail extends MusicArtist {
  /** Null when the platform has no picture for the artist, never an invented address. */
  avatarUrl: string | null;
  /** A wide banner picture; null when the platform only has the avatar. */
  coverUrl: string | null;
  /** Other names the artist goes by. */
  aliases: readonly string[];
  /** The biography; empty when the platform has none. */
  description: string;
  /** Followers (fans) the platform reports; null when it does not say. */
  followerCount: number | null;
  /** The platform marks the artist as verified, which the page shows as a badge. */
  verified: boolean;
}

/** What the signed-in account's relation to an artist looks like right now. */
export interface MusicArtistFollowState {
  followed: boolean;
  /** Followers (fans) the platform reports with the state; null when it does not say. */
  followerCount: number | null;
}

/** An album on an artist's page: the shared album plus when it came out. */
export interface MusicArtistAlbum extends MusicAlbum {
  /** Release time in milliseconds since the epoch; null when the platform does not say. */
  publishedAt: number | null;
  /** The platform's own label for the kind of release (album, single, EP); null when absent. */
  releaseType: string | null;
}

export interface MusicArtistAlbumPageRequest {
  offset: number;
  limit: number;
}

/** Albums from `offset` on, newest first, with where the next page starts or null at the end. */
export interface MusicArtistAlbumPage {
  offset: number;
  albums: MusicArtistAlbum[];
  nextOffset: number | null;
}

/**
 * Artist reading, implemented by every platform with `artist.read`. Following is optional and
 * present with `artist.follow`.
 */
export interface MusicArtistSource {
  getArtist(artist: MusicResourceRef<"artist">, signal?: AbortSignal): Promise<MusicArtistDetail>;
  /** The artist's most played tracks, most played first. */
  getArtistTopTracks(
    artist: MusicResourceRef<"artist">,
    signal?: AbortSignal,
  ): Promise<MusicTrack[]>;
  getArtistAlbums(
    artist: MusicResourceRef<"artist">,
    page: MusicArtistAlbumPageRequest,
    signal?: AbortSignal,
  ): Promise<MusicArtistAlbumPage>;
  /** Whether the signed-in account follows the artist. */
  getArtistFollowState?(
    artist: MusicResourceRef<"artist">,
    signal?: AbortSignal,
  ): Promise<MusicArtistFollowState>;
  /** Follows or unfollows the artist for the signed-in account. */
  setArtistFollowed?(artist: MusicResourceRef<"artist">, followed: boolean): Promise<void>;
}
