import type { MouseEvent } from "react";
import type { SongDetail } from "@/types/song/api";

export interface CarouselSwipeOptions {
  onNext: () => void;
  onPrevious: () => void;
  threshold?: number;
}

export type CarouselDirection = -1 | 1;

export interface HomePlaybackActions {
  loadingPlayId: string | null;
  handlePlayPlaylist: (id: number | string, event: MouseEvent) => Promise<void>;
  handlePlayAlbum: (id: number | string, event: MouseEvent) => Promise<void>;
  handlePlayArtistTopSongs: (id: number | string, event: MouseEvent) => Promise<void>;
  playSongs: (songs: SongDetail[], index: number) => Promise<void>;
}

export interface ArtistTopListItem {
  id: number;
  name: string;
  picUrl: string;
  musicSize?: number;
}

export type BannerTargetKind = "album" | "artist" | "playlist" | "radio" | "song";

export interface BannerDestination {
  href: string;
  isExternal: boolean;
}
