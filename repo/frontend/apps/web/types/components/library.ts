import type { ReactNode } from "react";
import type { CloudUploadProgress } from "@/types/api/cloud";
import type { SongDetail } from "@/types/song/api";
import type { RecommendedPodcast } from "@/types/voice/api";
import type { RadioDetail } from "@/types/radio/api";
import type { PodcastViewMode } from "@/types/library";

export interface LibraryContentStateProps {
  children: ReactNode;
  emptyState: ReactNode;
  hasItems: boolean;
  isError: boolean;
  isLoading: boolean;
  isRetrying: boolean;
  loadingContent?: ReactNode;
  onRetry: () => void;
}

export interface SubscribedPodcastCardProps {
  isActive: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  onPause: () => void;
  onPlay: () => void;
  podcast: RadioDetail;
}

export interface SubscribedPodcastGridProps {
  podcasts: RadioDetail[];
}

export interface SubscribedPodcastTableProps {
  podcasts: RadioDetail[];
}

export interface PodcastViewToggleProps {
  onChange: (view: PodcastViewMode) => void;
  value: PodcastViewMode;
}

export interface PodcastRecommendationsProps {
  isError: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  podcasts: RecommendedPodcast[];
}

export interface CloudDriveActionsProps {
  onUpload: (files: File[]) => void;
  uploadProgress: CloudUploadProgress | null;
}

export interface CloudStorageRingProps {
  maxSize: number;
  songCount: number;
  usedSize: number;
}

export interface CloudTrackActions {
  onDownload: (track: SongDetail) => void;
  onMatch: (track: SongDetail) => void;
  onRemove: (track: SongDetail) => void;
  onUnmatch: (track: SongDetail) => void;
}

export interface CloudSongContextMenuProps {
  children: ReactNode;
  cloudActions: CloudTrackActions;
  isActive: boolean;
  isPlaying: boolean;
  onOpenContextMenu?: () => void;
  onPlay: () => void;
  selectedSongs?: SongDetail[];
  song: SongDetail;
}

export interface CloudMatchDialogProps {
  busy: boolean;
  onClose: () => void;
  onConfirm: (adjustSongId: number) => void;
  /** 要匹配的云盘歌曲；为 null 时对话框关闭。 */
  song: SongDetail | null;
}
