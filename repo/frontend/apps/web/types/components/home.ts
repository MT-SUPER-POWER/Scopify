import type { MouseEvent, ReactNode } from "react";
import type { NeteaseAlbum } from "@/types/api/album";
import type { NeteaseBanner } from "@/types/api/banner";
import type { SongDetail } from "@/types/api/music";
import type { RecommendPlaylist } from "@/types/api/playlist";
import type { ToplistDetailItem } from "@/types/api/toplist";
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

export interface NewSongsSectionProps {
  songs: SongDetail[];
  onPlaySong: (song: SongDetail, index: number) => void;
  onPlayAll: () => void;
  pageSize?: number;
}

export interface ToplistSectionProps {
  toplists: ToplistDetailItem[];
  loadingPlayId?: string | null;
  onPlayToplist: (id: number | string, event: React.MouseEvent) => void;
}

export interface NewAlbumsSectionProps {
  albums: NeteaseAlbum[];
  loadingPlayId?: string | null;
  onPlayAlbum: (id: number | string, event: React.MouseEvent) => void;
  pageSize?: number;
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

export type HomeDailyRecommendationProps = Pick<HomeGreetingSectionProps, "dateInfo">;
