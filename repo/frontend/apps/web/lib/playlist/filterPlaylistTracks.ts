import type { PlayerTrack } from "@/types/player/model";

export function normalizePlaylistSearchQuery(searchQuery?: string | null): string {
  return searchQuery?.trim().toLowerCase() ?? "";
}

export function filterPlaylistTracks(
  tracks: PlayerTrack[],
  searchQuery?: string | null,
): PlayerTrack[] {
  const query = normalizePlaylistSearchQuery(searchQuery);
  if (!query) return tracks;

  return tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(query) ||
      track.artists.some((artist) => artist.name.toLowerCase().includes(query)) ||
      (track.album?.title.toLowerCase() ?? "").includes(query),
  );
}

export function resolvePlaylistPlaySourceId(
  baseSourceId: string | null,
  searchQuery?: string | null,
): string | null {
  const query = normalizePlaylistSearchQuery(searchQuery);
  if (!query) return baseSourceId;
  return baseSourceId ? `${baseSourceId}:search:${query}` : `search:${query}`;
}
