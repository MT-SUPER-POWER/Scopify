export interface CarouselSwipeOptions {
  onNext: () => void;
  onPrevious: () => void;
  threshold?: number;
}

export type CarouselDirection = -1 | 1;

export type HomeSectionId = "playlists" | "voices" | "artists" | "songs" | "toplists" | "albums";

export interface HomeSectionLoadState {
  id: HomeSectionId;
  hasContent: boolean;
  isFetching: boolean;
  isError: boolean;
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
