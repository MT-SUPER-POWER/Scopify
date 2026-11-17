import type { ArtistInfo } from "@/types/artist/model";
import type { SongDetail } from "@/types/song/api";

export interface ArtistSongsContentProps {
  artistId: string;
}

export interface PopularTracksProps {
  tracks: SongDetail[];
  queue: SongDetail[];
  artist: ArtistInfo;
}

export interface ArtistLinkItem {
  id?: number | string | null;
  name: string;
}

export interface ArtistInlineLinksProps {
  artists: ArtistLinkItem[];
  className?: string;
}
