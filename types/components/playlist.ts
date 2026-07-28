import type { HTMLAttributes, RefObject } from "react";

import type { SongDetail } from "@/types/api/music";

export interface PlaylistTagSelectorProps {
  maxSelected: number;
  onChange: (tags: string[]) => void;
  value: string[];
}

export interface PlaylistActionsProps {
  dailyDate?: null | string;
  inputRef: RefObject<HTMLInputElement | null>;
  isDaily: boolean;
  onSearchChange: (query: string) => void;
  onSearchClose: () => void;
  onSearchOpen: () => void;
  playlistId: null | string;
  searchOpen: boolean;
  searchQuery: string;
  tracks: SongDetail[];
}

export type DailyRecommendationMode = "current" | "history";

export interface TracklistTableProps {
  dailyRecommendationMode?: DailyRecommendationMode;
  disableVirtualization?: boolean;
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
  playSourceId?: null | string;
  tracks?: SongDetail[];
}

export interface TrackRowProps extends Omit<HTMLAttributes<HTMLTableRowElement>, "onPlay"> {
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
