import type { MusicResourceRef } from "./identity";
import type { MusicCreditedArtist } from "./search";
import type { MusicAlbum, MusicTrack } from "./track";

/** An artist credited on an album, with the picture the album header shows. */
export interface MusicAlbumArtist extends MusicCreditedArtist {
  /** Null when the platform has no picture for the artist, never an invented address. */
  avatarUrl: string | null;
}

/** An album's own page: the shared album plus its descriptive fields. Tracks come apart. */
export interface MusicAlbumDetail extends MusicAlbum {
  artists: readonly MusicAlbumArtist[];
  /** Release time in milliseconds since the epoch; null when the platform does not say. */
  publishedAt: number | null;
  description: string;
  /** The record label or publisher; null when the platform does not say. */
  company: string | null;
  /** The platform's own label for the kind of release (album, single, EP); null when absent. */
  releaseType: string | null;
  /** A finer label such as a genre or a release subtype; null when absent. */
  subType: string | null;
  /** The number of tracks the platform declares. */
  trackCount: number;
}

/** An album with its tracks, which the platforms serve in one reply. */
export interface MusicAlbumContent {
  album: MusicAlbumDetail;
  /** In disc order, each with the album's artwork when the platform leaves it off the track. */
  tracks: MusicTrack[];
}

/**
 * Album reading, implemented by every platform with `album.read`. Saving an album to the
 * library is optional and present with `album.subscribe`.
 */
export interface MusicAlbumSource {
  getAlbum(album: MusicResourceRef<"album">, signal?: AbortSignal): Promise<MusicAlbumContent>;
  /** Saves or removes the album in the signed-in account's library. */
  setAlbumSubscribed?(album: MusicResourceRef<"album">, subscribed: boolean): Promise<void>;
}
