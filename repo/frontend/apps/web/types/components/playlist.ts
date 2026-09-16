import type { HTMLAttributes, ReactNode, RefObject } from "react";

import type { SongDetail } from "@/types/api/music";
import type { CommentResourceKind } from "@/types/api/comment";
import type { PlaylistInfo } from "@/types/playlist";

export interface PlaylistTagSelectorProps {
  maxSelected: number;
  onChange: (tags: string[]) => void;
  value: string[];
}

export interface PlaylistActionsProps {
  actionSlot?: ReactNode;
  commentResourceId?: null | string;
  commentResourceKind?: CommentResourceKind;
  dailyDate?: null | string;
  inputRef: RefObject<HTMLInputElement | null>;
  isDaily: boolean;
  isSticky?: boolean;
  onPlayToggle?: () => void;
  onSearchChange: (query: string) => void;
  onSearchClose: () => void;
  onSearchOpen: () => void;
  playlistId: null | string;
  playlistInfo?: PlaylistInfo | null;
  playSourceId?: null | string;
  searchOpen: boolean;
  searchQuery: string;
  showShuffle?: boolean;
  tracks: SongDetail[];
}

export interface PlaylistContentProps {
  actionSlot?: ReactNode;
  commentResourceId?: null | string;
  commentResourceKind?: CommentResourceKind;
  contentSlot?: (props: PlaylistContentSlotProps) => ReactNode;
  dailyDate: null | string;
  hideAlbumColumn?: boolean;
  isDailyRecommend: boolean;
  isLoading: boolean;
  /** Optional negative-feedback action for tracks shown by the Personal FM virtual playlist. */
  onDislikePersonalFm?: (track: SongDetail) => void;
  onPlayToggle?: () => void;
  onTrackPlay?: (track: SongDetail) => void;
  playlistId: null | string;
  playlistInfo: PlaylistInfo | null;
  playSourceId?: null | string;
  readonly?: boolean;
  refetchTracks: () => void | Promise<unknown>;
  setTracks?: (tracks: SongDetail[]) => void;
  showShuffle?: boolean;
  themeColor: null | string;
  tracks: SongDetail[];
}

export interface PlaylistContentSlotProps {
  searchQuery: string;
}

export type PlaylistHeroProps = Pick<
  PlaylistContentProps,
  "isLoading" | "themeColor" | "playlistInfo" | "isDailyRecommend"
>;

export interface PlaylistHeaderSkeletonProps {
  showActions?: boolean;
}

export type DailyRecommendationMode = "current" | "history";

export interface TracklistTableProps {
  /**
   * Whether this playlist context grants the current user permission to remove tracks.
   * The table does not infer ownership from the URL; PlaylistContent resolves it once
   * from the loaded playlist creator and signed-in user.
   */
  canRemoveFromPlaylist?: boolean;
  dailyRecommendationMode?: DailyRecommendationMode;
  disableVirtualization?: boolean;
  hideAlbumColumn?: boolean;
  emptyActionLabel?: string;
  hideDateColumn?: boolean;
  hideLikeColumn?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onEmptyAction?: () => void;
  /** Optional negative-feedback action for tracks shown by the Personal FM virtual playlist. */
  onDislikePersonalFm?: (track: SongDetail) => void;
  onPlayTrack?: (track: SongDetail) => void;
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
  selection?: {
    selectedIds: Set<number>;
    selectedTracks: SongDetail[];
    isSelected: (id: number) => boolean;
    handleRowClick: (trackId: number, event: React.MouseEvent) => void;
    handleRowContextMenu: (trackId: number) => void;
    clearSelection: () => void;
    selectAll: () => void;
  };
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
  isSelected?: boolean;
  onLikeToggle?: (trackID: number | string) => void;
  onPlay: (track: SongDetail) => void;
  onRowClick?: (event: React.MouseEvent) => void;
  onRequestDelete: (playlistId: number | string | undefined, trackId: number) => void;
  playlistID: null | string;
  setIsPlaying: (v: boolean) => void;
  track: SongDetail;
}

export interface SortableTrackRowProps extends TrackRowProps {
  allowReorder: boolean;
  onRowElementChange?: (index: number, element: HTMLTableRowElement | null) => void;
}

export type TrackTitleCellProps = Pick<TrackRowProps, "track" | "isActive">;

export interface PlaylistTrackDeleteRequest {
  playlistId: number | string | undefined;
  trackId: number;
}

export interface PlaylistTrackListProps extends TracklistTableProps {
  playlistId: string | null;
}

export interface PlaylistTableSongRowProps extends SortableTrackRowProps {
  selectedSongs: SongDetail[];
  onSelectTrack: (id: number, event: React.MouseEvent) => void;
  onContextTrack: (id: number) => void;
  canRemoveFromPlaylist: boolean;
  isDailyRecommend: boolean;
  readonly: boolean;
  onDislikeDailyRecommend: (id: number | string) => Promise<void>;
  onDislikePersonalFm?: (track: SongDetail) => void;
}

export type TrackRowCellsProps = Pick<
  TrackRowProps,
  | "track"
  | "index"
  | "isActive"
  | "isPlaying"
  | "isLiked"
  | "isScrolling"
  | "hideAlbumColumn"
  | "hideDateColumn"
  | "hideLikeColumn"
  | "onPlay"
  | "setIsPlaying"
>;

export interface PlaylistMoreMenuProps {
  playlistId: string;
  playlistInfo: PlaylistInfo;
  isSticky?: boolean;
}
