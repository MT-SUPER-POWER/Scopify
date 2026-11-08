import type { MusicPlaylistSource } from "@scopify/music-domain/playlist";

import { adaptQqPlaylistDetail, adaptQqPlaylistSong } from "@/lib/providers/qq/adapters/playlist";
import { getQqPlaylistDetail } from "@/lib/providers/qq/api/playlist";
import type { QqPlaylistDetailDto } from "@/types/providers/qq/playlistApi";

/**
 * QQ serves a playlist and its songs in one reply, so the detail and the track pages a page
 * asks for together share one request while it is in flight.
 */
const pendingDetails = new Map<string, Promise<QqPlaylistDetailDto>>();

function readPlaylist(disstid: string, signal?: AbortSignal) {
  const pending = pendingDetails.get(disstid);
  if (pending) return pending;
  const request = getQqPlaylistDetail(disstid, signal).finally(() => {
    pendingDetails.delete(disstid);
  });
  pendingDetails.set(disstid, request);
  return request;
}

export const qqPlaylistSource: MusicPlaylistSource = {
  async getPlaylist(playlist, options) {
    return adaptQqPlaylistDetail(await readPlaylist(playlist.id, options?.signal));
  },

  async getPlaylistTracks(playlist, { offset, limit }, options) {
    const detail = await readPlaylist(playlist.id, options?.signal);
    const songs = (detail.songlist ?? []).slice(offset, offset + limit);
    return { offset, tracks: songs.map(adaptQqPlaylistSong) };
  },
};
