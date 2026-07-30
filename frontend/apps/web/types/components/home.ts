import type { NeteaseBanner } from "@/types/api/banner";
import type { CarouselDirection } from "@/types/home";

export interface ActivityBannerCardProps {
  banner: NeteaseBanner;
  imageAlt: string;
}

export interface CarouselDotNavigationProps {
  activeIndex: number;
  count: number;
  direction: CarouselDirection;
  getSlideLabel: (index: number) => string;
  label: string;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
}
