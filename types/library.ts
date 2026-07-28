export interface LibraryMediaItem {
  coverUrl?: string;
  date?: number;
  href?: string;
  id: number | string;
  isArtist?: boolean;
  subtitle?: string;
  title: string;
}

export type PodcastLibraryTab = "created" | "likedVoices" | "purchased" | "subscribed";
