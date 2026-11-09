import type { MusicResourceRef } from "@scopify/music-domain/identity";

export interface ArtistCoverTheme {
  cover: string;
  color: string;
}

/** An album card of the artist page's discography. */
export interface DiscographyAlbum {
  ref: MusicResourceRef<"album">;
  title: string;
  coverUrl: string | null;
  /** Null when the platform does not say when the album came out. */
  releaseYear: number | null;
  /** The platform's label for the kind of release; null when it has none. */
  type: string | null;
}

export interface ArtistInfo {
  id: string;
  name: string;
  isVerified: boolean;
  /** Followers (fans); null when the platform does not report them. */
  listeners: number | null;
  headerImageUrl: string;
  avatar: string;
  bio: string;
}

export interface FollowedArtist {
  id: number;
  name: string;
  avatarUrl?: string;
  picUrl?: string;
  img1v1Url?: string;
}
