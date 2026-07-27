export interface CarouselSwipeOptions {
  onNext: () => void;
  onPrevious: () => void;
  threshold?: number;
}

export type CarouselDirection = -1 | 1;
