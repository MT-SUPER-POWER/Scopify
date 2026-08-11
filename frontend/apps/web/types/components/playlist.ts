import type { HTMLAttributes, ReactNode, RefObject } from "react";

import type { SongDetail } from "@/types/api/music";
import type { PlaylistInfo } from "@/types/playlist";

export interface PlaylistTagSelectorProps {
  maxSelected: number;
  onChange: (tags: string[]) => void;
  value: string[];
}

export interface PlaylistActionsProps {
  actionSlot?: ReactNode;
  dailyDate?: null | string;
  inputRef: RefObject<HTMLInputElement | null>;
  isDaily: boolean;
  isSticky?: boolean;
  onSearchChange: (query: string) => void;
  onSearchClose: () => void;
  onSearchOpen: () => void;
  playlistId: null | string;
  playSourceId?: null | string;
  searchOpen: boolean;
  searchQuery: string;
  tracks: SongDetail[];
}

export interface PlaylistContentProps {
  actionSlot?: ReactNode;
  contentSlot?: (props: PlaylistContentSlotProps) => ReactNode;
  dailyDate: null | string;
  hideAlbumColumn?: boolean;
  isDailyRecommend: boolean;
  isLoading: boolean;
  playlistId: null | string;
  playlistInfo: PlaylistInfo | null;
  playSourceId?: null | string;
  readonly?: boolean;
  refetchTracks: () => void | Promise<unknown>;
  setTracks?: (tracks: SongDetail[]) => void;
  themeColor: null | string;
  tracks: SongDetail[];
}

export interface PlaylistContentSlotProps {
  searchQuery: string;
}

export type DailyRecommendationMode = "current" | "history";

export interface TracklistTableProps {
  dailyRecommendationMode?: DailyRecommendationMode;
  disableVirtualization?: boolean;
  hideAlbumColumn?: boolean;
  emptyActionLabel?: string;
  hideDateColumn?: boolean;
  hideLikeColumn?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onEmptyAction?: () => void;
  onTracksChange?: (tracks: SongDetail[]) => void;
  onSearchChange?: (v: string) => void;
  onSearchClose?: () => void;
  onSearchOpen?: () => void;
  readonly?: boolean;
  searchOpen?: boolean;
  searchQuery?: string;
  stickyHeaderClassName?: string;
  stickyHeaderTop?: number;
  playSourceId?: null | string;
  tracks?: SongDetail[];
}

export interface TrackRowProps extends Omit<HTMLAttributes<HTMLTableRowElement>, "onPlay"> {
  durationColumnWidth?: number;
  hideAlbumColumn?: boolean;
  hideDateColumn?: boolean;
  hideLikeColumn?: boolean;
  index: number;
  isActive: boolean;
  isLiked: boolean;
  isPlaying: boolean;
  isScrolling?: boolean;
  onLikeToggle?: (trackID: number | string) => void;
  onPlay: (track: SongDetail) => void;
  onRequestDelete: (playlistId: number | string | undefined, trackId: number) => void;
  playlistID: null | string;
  setIsPlaying: (v: boolean) => void;
  track: SongDetail;
}
