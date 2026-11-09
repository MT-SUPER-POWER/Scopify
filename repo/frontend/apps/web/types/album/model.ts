import type { MusicAlbum } from "@scopify/music-domain/track";

import type { PlaylistViewMode } from "@/types/playlist/lattice";
import type { SongDetail } from "@/types/song/api";

export interface AlbumInfo {
  artistAvatar: string;
  /** The main artist's ID, or null when the platform does not name one to link to. */
  artistId: string | null;
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
  album: MusicAlbum;
  subscribe: boolean;
}

export interface AlbumActionsProps {
  albumId: string;
  /** 专辑曲目与名称，用于播放按钮旁的 MV 预览入口。 */
  albumTitle: string;
  /** 专辑里的网易云歌曲，只有它们带 MV 预览。 */
  previewSongs: SongDetail[];
  isAlbumCollected: boolean;
  isPlaying: boolean;
  isTogglingAlbumSubscribe: boolean;
  /** 沉浸视图只读网易云歌曲，其它平台的专辑不提供入口。 */
  onOpenLattice?: (mode?: PlaylistViewMode) => void;
  onPlay: () => void;
  onToggleSubscribe: () => void;
}
