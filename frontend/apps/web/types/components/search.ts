import type {
  Album,
  Artist,
  Category,
  Playlist,
  Podcast,
  SearchBestMatch,
  Song,
  Voice,
} from "@/types/search";
import type { ReactNode } from "react";

export interface AllViewProps {
  albums: Album[];
  artists: Artist[];
  bestMatch: SearchBestMatch | null;
  loadingPlayId: string | null;
  onNavigate: (path: string) => void;
  onPlayAlbum: (album: Album, event: React.MouseEvent) => void;
  onPlayPlaylist: (playlist: Playlist, event: React.MouseEvent) => void;
  onSeeAll: (category: Category) => void;
  podcasts: Podcast[];
  playlists: Playlist[];
  songs: Song[];
  voices: Voice[];
}

export interface PodcastCardProps {
  podcast: Podcast;
}

export interface PodcastRowProps {
  index: number;
  podcast: Podcast;
}

export type SearchResultCategory = Exclude<Category, "All">;

export interface SearchCategoryHeaderProps {
  actions?: ReactNode;
  category: SearchResultCategory;
}

export interface SearchPaginationProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export interface SongsViewProps extends SearchPaginationProps {
  songs: Song[];
}

export interface PodcastsViewProps extends SearchPaginationProps {
  podcasts: Podcast[];
}

export type GridSearchCategory = Extract<Category, "Albums" | "Playlists" | "Artists">;

export interface GridCategoryViewProps extends SearchPaginationProps {
  activeCategory: GridSearchCategory;
  albums: Album[];
  artists: Artist[];
  loadingPlayId: string | null;
  onNavigate: (path: string) => void;
  onPlayAlbum: (album: Album, event: React.MouseEvent) => void;
  onPlayPlaylist: (playlist: Playlist, event: React.MouseEvent) => void;
  playlists: Playlist[];
}

export interface VoiceItemProps {
  enableContextMenu?: boolean;
  index: number;
  onViewTranscript?: (voice: Voice) => void;
  transcriptMode?: "dialog" | "popover";
  variant?: "default" | "liked" | "preview";
  voice: Voice;
  voices: Voice[];
}

export interface VoiceListProps {
  enableContextMenu?: boolean;
  layout?: "grid" | "list";
  limit?: number;
  onViewAll?: () => void;
  onViewTranscript?: (voice: Voice) => void;
  transcriptMode?: "dialog" | "popover";
  variant?: "default" | "liked" | "preview";
  voices: Voice[];
}

export interface VoicesViewProps extends SearchPaginationProps {
  voices: Voice[];
}

export interface InfiniteScrollTriggerOptions {
  enabled: boolean;
  onIntersect: () => void;
}
