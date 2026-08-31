import type { NeteaseBanner } from "@/types/api/banner";
import type { RecommendPlaylist } from "@/types/api/playlist";
import type { CarouselDirection } from "@/types/home";
import type { Artist, Voice } from "@/types/search";

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

export interface PersonalizedPlaylistsProps {
  loadingPlayId?: string | null;
  onPlayPlaylist: (id: number | string, event: React.MouseEvent) => void;
  pageSize?: number;
  playlists: RecommendPlaylist[];
  userName?: string;
}

export interface HomeGreetingSectionProps {
  dateInfo: {
    dateNum: number;
    dayOfWeek: string;
  };
  greeting: string;
  loadingPlayId?: string | null;
  onPlayPlaylist: (id: number | string, event: React.MouseEvent) => void;
  pageSize?: number;
  playlists: RecommendPlaylist[];
}

export interface SuggestedArtistsProps {
  artists: Artist[];
  pageSize?: number;
}

export interface RecommendedVoiceListsProps {
  isRefreshing?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  pageSize?: number;
  voices: Voice[];
}

export interface SectionPaginationProps {
  className?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageCount: number;
}
