export interface ArtistLinkItem {
  id?: number | string | null;
  name: string;
}

export interface ArtistInlineLinksProps {
  artists: ArtistLinkItem[];
  className?: string;
}
