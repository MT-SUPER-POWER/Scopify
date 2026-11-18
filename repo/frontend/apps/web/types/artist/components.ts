import type { ArtistInfo } from "@/types/artist/model";
import type { PlayerTrack } from "@/types/player/model";

export interface ArtistSongsContentProps {
  artistId: string;
}

export interface PopularTracksProps {
  tracks: readonly PlayerTrack[];
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
