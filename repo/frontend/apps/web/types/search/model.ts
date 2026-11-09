import type { MusicPlaylist } from "@scopify/music-domain/playlist";
import type {
  MusicAlbumResult,
  MusicArtistResult,
  MusicSearchBestMatch,
  MusicSearchOverview,
} from "@scopify/music-domain/search";

import type { PlayerTrack } from "@/types/player/model";
import type { NeteaseSearchOverviewExtras } from "@/types/providers/netease/searchApi";

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

export interface Podcast {
  category?: string;
  coverUrl: string;
  description?: string;
  hostName?: string;
  id: number;
  name: string;
  programCount: number;
  score?: number;
  source?: "dj-radio" | "voice-list";
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

export interface LyricSearchItem {
  highlightText?: string;
  lyric: string;
  matchedLyric: string;
  song: Song;
}

/** What the search page lists. Songs, artists, albums and playlists are interface types. */
export interface SearchResults {
  albums: MusicAlbumResult[];
  artists: MusicArtistResult[];
  bestMatch: MusicSearchBestMatch | null;
  lyrics?: LyricSearchItem[];
  podcasts: Podcast[];
  playlists: MusicPlaylist[];
  songs: PlayerTrack[];
  voices: Voice[];
}

/** An overview as the page reads it; NetEase adds its podcast and voice blocks. */
export type SearchOverview = MusicSearchOverview & {
  readonly netease?: NeteaseSearchOverviewExtras;
};

export const CATEGORIES = [
  "All",
  "Songs",
  "Artists",
  "Playlists",
  "Albums",
  "Lyrics",
  "Sheets",
  "MVs",
  "Podcasts",
  "Voices",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface SearchRecentEntry {
  category: Category;
  keyword: string;
}
