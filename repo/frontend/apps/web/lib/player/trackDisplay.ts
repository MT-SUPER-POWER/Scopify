import type { MusicTrack } from "@scopify/music-domain/track";

import type { ArtistLinkItem } from "@/types/artist/components";

/** Artist links for a track; only NetEase artists have an artist page, others render as text. */
export function toArtistLinks(track: MusicTrack): ArtistLinkItem[] {
  const linkable = track.ref.provider === "netease";
  return track.artists.map((artist) => ({
    id: linkable ? artist.ref.id : null,
    name: artist.name,
  }));
}

/** The album page ID of a track, or null when its album has no page here (non-NetEase, singles). */
export function getLinkableAlbumId(track: MusicTrack): string | null {
  if (track.ref.provider !== "netease") return null;
  const id = track.album?.ref.id;
  return id && id !== "0" ? id : null;
}

export function formatTrackArtists(track: MusicTrack, separator = " / "): string {
  return track.artists.map((artist) => artist.name).join(separator);
}
