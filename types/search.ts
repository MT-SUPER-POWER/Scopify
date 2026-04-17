export interface Artist {
  id: number;
  name: string;
  picUrl: string | null;
  img1v1Url?: string;
  alias?: string[];
  albumSize?: number;
  musicSize?: number;
  fansSize?: number | null;
}

export interface Album {
  id: number;
  name: string;
  artist: Artist;
  publishTime: number;
  size: number;
  picUrl?: string;
  blurPicUrl?: string;
}

export interface Song {
  id: number;
  name: string;
  artists: Artist[];
  album: Album;
  duration: number;
  mvid?: number;
  fee?: number;
  alias?: string[];
}

export interface Playlist {
  id: number;
  name: string;
  coverImgUrl: string;
  creator?: { nickname: string };
  trackCount: number;
  playCount: number;
  bookCount?: number;
  description?: string;
}

export const CATEGORIES = ["All", "Songs", "Artists", "Playlists", "Albums"] as const;
export type Category = (typeof CATEGORIES)[number];
