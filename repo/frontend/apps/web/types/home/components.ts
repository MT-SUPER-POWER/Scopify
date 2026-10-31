import type { MouseEvent, ReactNode } from "react";
import type { NeteaseBanner } from "@/types/home/bannerApi";
import type { SongDetail } from "@/types/song/api";
import type { CarouselDirection, HomeContextValue } from "@/types/home/model";
import type { TranslationKey } from "@/lib/i18n";

export interface HomeSectionPendingProps {
  /** 用 useQuery 的栏目传 fetchStatus 判断的结果；Suspense 的骨架屏不传，按在线状态判断。 */
  isPaused?: boolean;
  kind: "greeting" | "grid" | "artist" | "songs" | "voices" | "toplists";
  title?: string;
  titleKey?: TranslationKey;
}

export interface ActivityBannerCardProps {
  banner: NeteaseBanner;
  imageAlt: string;
  isCenter?: boolean;
  onClickSide?: () => void;
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

export interface HomeDailyRecommendationProps {
  dateInfo: HomeContextValue["dateInfo"];
}

export interface SectionPaginationProps {
  className?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageCount: number;
}

export interface GridCardProps {
  id: string | number;
  name: string;
  coverUrl?: string;
  subtitle?: string;
  playCount?: number;
  isLoading?: boolean;
  isArtist?: boolean;
  appearance?: "default" | "home";
  onPlay?: (event: MouseEvent) => void;
  onClick?: () => void;
}

export interface GridCardSkeletonProps {
  isArtist?: boolean;
}

export interface CollapsibleSectionProps {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  collapsedHeight?: string;
  collapsedRows?: number;
  disableHeightCollapse?: boolean;
  showTrigger?: boolean;
}

export interface ToplistCarouselItem {
  artist: string;
  coverUrl: string;
  id: number;
  name: string;
  rank: number;
  song?: SongDetail;
}
