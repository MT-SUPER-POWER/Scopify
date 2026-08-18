import type { NeteaseBanner } from "@/types/api/banner";
import type { RecommendPlaylist } from "@/types/api/playlist";
import type { CarouselDirection } from "@/types/home";
import type { Artist, Voice } from "@/types/search";

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
  pageSize?: number;
  voices: Voice[];
}
