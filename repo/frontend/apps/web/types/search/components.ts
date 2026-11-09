import type { MusicPlaylist } from "@scopify/music-domain/playlist";
import type {
  MusicAlbumResult,
  MusicArtistResult,
  MusicSearchBestMatch,
} from "@scopify/music-domain/search";
import type { SongDetail } from "@/types/song/api";
import type { PlayerTrack } from "@/types/player/model";
import type { MvSummary } from "@/types/providers/netease/mvApi";
import type { MusicSheet } from "@/types/songResources/api";
import type { Category, LyricSearchItem, Podcast, Voice } from "@/types/search/model";
import type { ReactNode } from "react";

export interface AllViewProps {
  albums: MusicAlbumResult[];
  artists: MusicArtistResult[];
  bestMatch: MusicSearchBestMatch | null;
  /** The platform ranks a best match; without it the songs take the whole top row. */
  hasBestMatch: boolean;
  loadingPlayId: string | null;
  mvs: MvSummary[];
  onNavigate: (path: string) => void;
  onPlayAlbum: (album: MusicAlbumResult, event: React.MouseEvent) => void;
  onPlayPlaylist: (playlist: MusicPlaylist, event: React.MouseEvent) => void;
  onSeeAll: (category: Category) => void;
  podcasts: Podcast[];
  playlists: MusicPlaylist[];
  songs: PlayerTrack[];
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
  songs: PlayerTrack[];
}

export interface LyricsViewProps extends SearchPaginationProps {
  items: LyricSearchItem[];
  keyword?: string;
}

export interface MvsViewProps extends SearchPaginationProps {
  mvs: MvSummary[];
}

export interface PodcastsViewProps extends SearchPaginationProps {
  podcasts: Podcast[];
}

export type GridSearchCategory = Extract<Category, "Albums" | "Playlists" | "Artists">;

export interface GridCategoryViewProps extends SearchPaginationProps {
  activeCategory: GridSearchCategory;
  albums: MusicAlbumResult[];
  artists: MusicArtistResult[];
  loadingPlayId: string | null;
  onNavigate: (path: string) => void;
  onPlayAlbum: (album: MusicAlbumResult, event: React.MouseEvent) => void;
  onPlayPlaylist: (playlist: MusicPlaylist, event: React.MouseEvent) => void;
  playlists: MusicPlaylist[];
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

export interface LyricCardProps {
  currentSongId?: number;
  highlightKeyword?: string;
  isPlaying: boolean;
  item: LyricSearchItem;
  onPlay: (song: SongDetail) => void;
}

export interface HighlightedLyricTextProps {
  highlight?: string;
  text: string;
}

export interface SearchLyricSnippetProps {
  full?: boolean;
  item: LyricSearchItem;
  highlightKeyword?: string;
}

export interface SearchLyricActionsProps {
  song: SongDetail;
}

export interface SearchLyricDialogProps extends Pick<
  LyricCardProps,
  "item" | "highlightKeyword" | "onPlay"
> {
  song: SongDetail;
  isPlaying: boolean;
}

export interface SheetsViewProps {
  keyword: string;
}

export interface SheetSongResultCardProps {
  song: SongDetail;
  sheets: MusicSheet[];
  onSelectSong: (song: SongDetail) => void;
  onSelectSheet: (sheet: MusicSheet) => void;
}

export interface SheetSongFailureCardProps {
  song: SongDetail;
  error: Error;
  onRetry: () => void;
}
