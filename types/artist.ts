import type { SongDetail } from "@/types/api/music";

export interface Track {
  id: string | number;
  title: string;
  durationMs: number;
  ar: Array<{ id: string | number; name: string }>;
  al: {
    blurPicUrl?: string;
    coverUrl?: string;
    picUrl: string;
  };
  publishTime?: number;
  dt: number;
  raw?: unknown;
}

export interface Album {
  id: string | number;
  title: string;
  releaseYear: number;
  type: string;
  coverUrl: string;
}

export interface ArtistInfo {
  id: string | number;
  name: string;
  isVerified: boolean;
  listeners: number;
  headerImageUrl: string;
  avatar: string;
  bio: string;
}

export interface FollowedArtist {
  id: number;
  name: string;
  avatarUrl: string;
}

export interface ArtistCachePayload {
  artist: ArtistInfo | null;
  popularTracks: SongDetail[];
  hotTracksQueue: SongDetail[];
  discography: Album[];
}
