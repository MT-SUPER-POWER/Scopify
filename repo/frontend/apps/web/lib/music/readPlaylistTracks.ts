import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicPlaylistSource } from "@scopify/music-domain/playlist";
import type { MusicTrack } from "@scopify/music-domain/track";

const PAGE_SIZE = 1000;
/** A safety stop; no playlist a person plays from a shelf is near this long. */
const MAX_PAGES = 10;

/** Every track of a playlist, reading page after page until one comes back short. */
export async function readAllPlaylistTracks(
  source: Pick<MusicPlaylistSource, "getPlaylistTracks">,
  playlist: MusicResourceRef<"playlist">,
  options?: { signal?: AbortSignal },
): Promise<MusicTrack[]> {
  const tracks: MusicTrack[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await source.getPlaylistTracks(
      playlist,
      { offset: page * PAGE_SIZE, limit: PAGE_SIZE },
      options,
    );
    tracks.push(...result.tracks);
    if (result.tracks.length < PAGE_SIZE) break;
  }
  return tracks;
}
