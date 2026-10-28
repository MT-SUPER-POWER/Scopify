import type { SongDetail } from "@/types/song/api";

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

export interface AlbumActionsProps {
  albumId: string;
  /** 专辑曲目与名称，用于播放按钮旁的 MV 预览入口。 */
  albumTitle: string;
  tracks: SongDetail[];
  isAlbumCollected: boolean;
  isPlaying: boolean;
  isTogglingAlbumSubscribe: boolean;
  onOpenLattice: () => void;
  onPlay: () => void;
  onToggleSubscribe: () => void;
}
