export interface CarouselSwipeOptions {
  onNext: () => void;
  onPrevious: () => void;
  threshold?: number;
}

export type CarouselDirection = -1 | 1;

export type BannerTargetKind = "album" | "artist" | "playlist" | "radio" | "song";

export interface BannerDestination {
  href: string;
  isExternal: boolean;
}
