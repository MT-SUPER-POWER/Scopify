import type {
  MusicPlaylistDetail,
  MusicPlaylistReadOptions,
  MusicPlaylistTrackPage,
  MusicPlaylistTrackPageRequest,
} from "@scopify/music-domain/playlist";

import { adaptQqPlaylistSong } from "@/lib/providers/qq/adapters/playlist";
import { adaptQqToplistDetail } from "@/lib/providers/qq/adapters/recommend";
import { getQqToplistSongs } from "@/lib/providers/qq/api/recommend";

/** The most songs the backend serves for a chart in one request. */
const TOPLIST_REQUEST_LIMIT = 100;

/** A chart's own page: its description and size. The songs are paged apart. */
export async function readQqToplist(
  chartId: string,
  options?: MusicPlaylistReadOptions,
): Promise<MusicPlaylistDetail> {
  const data = await getQqToplistSongs(chartId, { offset: 0, limit: 1 }, options?.signal);
  return adaptQqToplistDetail({ ...data.toplist, preview: [] });
}

/** Songs of a chart from `offset`, reading as many backend requests as `limit` needs. */
export async function readQqToplistTracks(
  chartId: string,
  { offset, limit }: MusicPlaylistTrackPageRequest,
  options?: MusicPlaylistReadOptions,
): Promise<MusicPlaylistTrackPage> {
  const tracks: MusicPlaylistTrackPage["tracks"] = [];
  let next = offset;
  while (tracks.length < limit) {
    const data = await getQqToplistSongs(
      chartId,
      { offset: next, limit: Math.min(TOPLIST_REQUEST_LIMIT, limit - tracks.length) },
      options?.signal,
    );
    tracks.push(...data.songs.map(adaptQqPlaylistSong));
    next += data.songs.length;
    if (!data.more || data.songs.length === 0) break;
  }
  return { offset, tracks };
}
