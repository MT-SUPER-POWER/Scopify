import type { SongDetail } from "@/types/api/music";

export interface AlbumDetailData {
  info: AlbumInfo;
  tracks: SongDetail[];
}

export interface AlbumInfo {
  artistAvatar: string;
  artistId: number | string | undefined;
  artistName: string;
  company: string;
  cover: string;
  description: string;
  releaseYear: string;
  subType: string;
  title: string;
  totalSongs: number;
  type: string;
}

export interface AlbumSubscriptionMutation {
  id: number | string;
  subscribe: boolean;
}
