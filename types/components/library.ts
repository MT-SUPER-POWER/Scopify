import type { MouseEvent, ReactNode } from "react";
import type { RecommendedPodcast } from "@/types/api/voicelist";
import type { RadioDetail } from "@/types/api/radio";
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
  onPause: (event: MouseEvent<HTMLButtonElement>) => void;
  onPlay: (event: MouseEvent<HTMLButtonElement>) => void;
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
