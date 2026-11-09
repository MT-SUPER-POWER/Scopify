import type { MouseEvent } from "react";
import type { PlayerTrack } from "@/types/player/model";

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
  playTracks: (tracks: readonly PlayerTrack[], index: number) => Promise<void>;
}

export interface HomeContextValue {
  accountId: string;
  actions: HomePlaybackActions;
  dateInfo: { dateNum: number; dayOfWeek: string };
  greeting: string;
}

export interface ArtistTopListItem {
  id: string;
  name: string;
  picUrl: string;
}

export type BannerTargetKind = "album" | "artist" | "playlist" | "radio" | "song";

export interface BannerDestination {
  href: string;
  isExternal: boolean;
}
