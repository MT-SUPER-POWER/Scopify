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

export interface PodcastsViewProps {
  podcasts: Podcast[];
}

export interface VoiceItemProps {
  index: number;
  onViewTranscript?: (voice: Voice) => void;
  variant?: "default" | "preview";
  voice: Voice;
  voices: Voice[];
}

export interface VoiceListProps {
  limit?: number;
  onViewAll?: () => void;
  onViewTranscript?: (voice: Voice) => void;
  variant?: "default" | "preview";
  voices: Voice[];
}

export interface VoicesViewProps {
  voices: Voice[];
}
