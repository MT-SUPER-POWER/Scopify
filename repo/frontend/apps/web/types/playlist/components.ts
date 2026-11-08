import type { HTMLAttributes, ReactNode, RefObject } from "react";

import type { PlayerTrack } from "@/types/player/model";
import type { SongDetail } from "@/types/song/api";
import type { CommentResourceKind } from "@/types/comment/api";
import type { PlaylistInfo } from "@/types/playlist/model";
import type { PlaylistViewMode } from "@/types/playlist/lattice";
import type { CloudTrackActions } from "@/types/library/components";
import type { DailyCategory } from "@/types/playlist/api";

export interface DailyCategorySelectorProps {
  accountId: number | string;
  selected: DailyCategory;
}
export interface DailyRecommendationSwitchProps {
  label: string;
  onClick: () => void;
}
export interface DailyCategorySelectorBodyProps extends DailyCategorySelectorProps {
  onClose: () => void;
}
export interface DailyCategoryPageBodyProps {
  accountId: number | string;
}

export interface PlaylistTagSelectorProps {
  maxSelected: number;
  onChange: (tags: string[]) => void;
  value: string[];
}

export interface PlaylistActionsProps {
  actionSlot?: ReactNode;
  /** Rendered at the start of the right-hand action group, before search. */
  trailingActionSlot?: ReactNode;
  commentResourceId?: null | string;
  commentResourceKind?: CommentResourceKind;
  dailyDate?: null | string;
  inputRef: RefObject<HTMLInputElement | null>;
  isDaily: boolean;
  isSticky?: boolean;
  onOpenLattice?: (mode?: PlaylistViewMode) => void;
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
  tracks: PlayerTrack[];
}

export type PlaylistSearchShortcutOptions = Pick<
  PlaylistActionsProps,
  "inputRef" | "onSearchOpen" | "onSearchClose" | "searchOpen"
>;

export interface PlaylistContentProps {
  actionSlot?: ReactNode;
  /** Rendered at the start of the right-hand action group, before search. */
  trailingActionSlot?: ReactNode;
  commentResourceId?: null | string;
  commentResourceKind?: CommentResourceKind;
  contentSlot?: (props: PlaylistContentSlotProps) => ReactNode;
  dailyDate: null | string;
  /** Replaces the date column header when it shows something other than release dates. */
  dateColumnLabel?: string;
  hideAlbumColumn?: boolean;
  isDailyRecommend: boolean;
  isLoading: boolean;
  /** Optional negative-feedback action for tracks shown by the Personal FM virtual playlist. */
  onDislikePersonalFm?: (track: SongDetail) => void;
  /** Present only on the cloud drive page; swaps the song menu for cloud file actions. */
  cloudActions?: CloudTrackActions;
  onPlayToggle?: () => void;
  onTrackPlay?: (track: PlayerTrack) => void;
  playlistId: null | string;
  playlistInfo: PlaylistInfo | null;
  playSourceId?: null | string;
  readonly?: boolean;
  refetchTracks: () => void | Promise<unknown>;
  setTracks?: (tracks: PlayerTrack[]) => void;
  showShuffle?: boolean;
  themeColor: null | string;
  tracks: PlayerTrack[];
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
  dateColumnLabel?: string;
  disableVirtualization?: boolean;
  hideAlbumColumn?: boolean;
  emptyActionLabel?: string;
  hideDateColumn?: boolean;
  hideLikeColumn?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onEmptyAction?: () => void;
  /** Optional negative-feedback action for tracks shown by the Personal FM virtual playlist. */
  onDislikePersonalFm?: (track: SongDetail) => void;
  /** Present only on the cloud drive page; swaps the song menu for cloud file actions. */
  cloudActions?: CloudTrackActions;
  onPlayTrack?: (track: PlayerTrack) => void;
  onTracksChange?: (tracks: PlayerTrack[]) => void;
  onSearchChange?: (v: string) => void;
  onSearchClose?: () => void;
  onSearchOpen?: () => void;
  readonly?: boolean;
  searchOpen?: boolean;
  searchQuery?: string;
  stickyHeaderClassName?: string;
  stickyHeaderTop?: number;
  playSourceId?: null | string;
  tracks?: PlayerTrack[];
  selection?: TrackSelection;
}

/** Row selection, keyed by the tracks' native IDs (one list never mixes platforms). */
export interface TrackSelection {
  selectedIds: Set<string>;
  selectedTracks: PlayerTrack[];
  isSelected: (id: string) => boolean;
  handleRowClick: (trackId: string, event: React.MouseEvent) => void;
  handleRowContextMenu: (trackId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
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
  onPlay: (track: PlayerTrack) => void;
  onRowClick?: (event: React.MouseEvent) => void;
  onRequestDelete: (playlistId: number | string | undefined, track: PlayerTrack) => void;
  playlistID: null | string;
  setIsPlaying: (v: boolean) => void;
  track: PlayerTrack;
}

export interface SortableTrackRowProps extends TrackRowProps {
  allowReorder: boolean;
  onRowElementChange?: (index: number, element: HTMLTableRowElement | null) => void;
}

export type TrackTitleCellProps = Pick<TrackRowProps, "track" | "isActive">;

export interface PlaylistTrackDeleteRequest {
  playlistId: number | string | undefined;
  track: PlayerTrack;
}

export interface PlaylistTrackListProps extends TracklistTableProps {
  playlistId: string | null;
}

export interface PlaylistTableSongRowProps extends SortableTrackRowProps {
  /** The selected rows' NetEase songs, for the batch actions of the NetEase song menu. */
  selectedSongs: SongDetail[];
  onSelectTrack: (id: string, event: React.MouseEvent) => void;
  onContextTrack: (id: string) => void;
  canRemoveFromPlaylist: boolean;
  isDailyRecommend: boolean;
  readonly: boolean;
  onDislikeDailyRecommend: (id: number) => Promise<void>;
  onDislikePersonalFm?: (track: SongDetail) => void;
  /** Present only on the cloud drive page; swaps the song menu for cloud file actions. */
  cloudActions?: CloudTrackActions;
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

export type PlaylistContentPresentationOptions = Pick<
  PlaylistContentProps,
  | "playlistInfo"
  | "tracks"
  | "playlistId"
  | "isDailyRecommend"
  | "dailyDate"
  | "readonly"
  | "refetchTracks"
>;

// 定义表单数据结构
export interface PlaylistFormData {
  name: string;
  desc?: string;
  tags?: string[];
  coverFile?: File | null; // 实际上传的文件对象
}

export interface UpdatePlaylistInitialData {
  name?: string;
  desc?: string;
  description?: string | null;
  tags?: string[];
  coverUrl?: string;
  coverImgUrl?: string;
  cover?: string;
}

export interface UpdatePlaylistDialogProps {
  open: boolean;
  initialData?: UpdatePlaylistInitialData;
  onConfirm: (data: PlaylistFormData) => void;
  onCancel: () => void;
}
