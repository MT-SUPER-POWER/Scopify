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

export interface Podcast {
  category?: string;
  coverUrl: string;
  description?: string;
  hostName?: string;
  id: number;
  name: string;
  programCount: number;
  subscriberCount: number;
}

export interface Voice {
  auditStatus?: null | string;
  coverUrl: string;
  description?: string;
  displayStatus?: null | string;
  duration: number;
  hostName?: string;
  id: number;
  isPlayable?: boolean;
  lastPlayTime?: number;
  likeTime?: number;
  mainSong: Song | null;
  name: string;
  podcastName: string;
  playCount?: number;
  publishTime?: number;
}

export type SearchBestMatch =
  | { kind: "album"; album: Album }
  | { kind: "artist"; artist: Artist }
  | { kind: "playlist"; playlist: Playlist }
  | { kind: "song"; song: Song };

export interface SearchResults {
  albums: Album[];
  artists: Artist[];
  bestMatch: SearchBestMatch | null;
  podcasts: Podcast[];
  playlists: Playlist[];
  songs: Song[];
  voices: Voice[];
}

export const CATEGORIES = [
  "All",
  "Songs",
  "Artists",
  "Playlists",
  "Albums",
  "Podcasts",
  "Voices",
] as const;
export type Category = (typeof CATEGORIES)[number];
