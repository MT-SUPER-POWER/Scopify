import type { MusicPlaylistSource, MusicPlaylistTrackPage } from "@scopify/music-domain/playlist";

import { adaptQqPlaylistDetail, adaptQqPlaylistSong } from "@/lib/providers/qq/adapters/playlist";
import { qqToplistIdOf } from "@/lib/providers/qq/adapters/recommend";
import { getQqPlaylistDetail } from "@/lib/providers/qq/api/playlist";
import { readQqToplist, readQqToplistTracks } from "@/lib/providers/qq/toplist";
import { getQqLikedSongs } from "@/lib/providers/qq/api/library";
import { findQqLikedPlaylist } from "@/lib/providers/qq/likedPlaylist";
import { changeQqPlaylistTrackList } from "@/lib/providers/qq/libraryWrite";
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

/** The account's liked songs are read with their own call, a page of at most 100 at a time. */
const LIKED_PAGE_SIZE = 100;

async function readLikedTracks(
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<MusicPlaylistTrackPage> {
  const tracks = [];
  let position = offset;
  while (tracks.length < limit) {
    const data = await getQqLikedSongs(
      position,
      Math.min(LIKED_PAGE_SIZE, limit - tracks.length),
      signal,
    );
    tracks.push(...data.songs.map(adaptQqPlaylistSong));
    position += data.songs.length;
    if (!data.more || data.songs.length === 0) break;
  }
  return { offset, tracks };
}

export const qqPlaylistSource: MusicPlaylistSource = {
  getPlaylistShareUrl(playlist) {
    // A chart is not a playlist on the web; only real playlists have a page to share.
    return qqToplistIdOf(playlist.id) === null
      ? `https://y.qq.com/n/ryqq/playlist/${encodeURIComponent(playlist.id)}`
      : null;
  },

  async getPlaylist(playlist, options) {
    const chartId = qqToplistIdOf(playlist.id);
    if (chartId) return readQqToplist(chartId, options);
    const liked = findQqLikedPlaylist(playlist.id);
    if (liked) {
      return {
        ...liked.playlist,
        description: "",
        tags: [],
        createdAt: null,
        visibility: liked.visibility,
      };
    }
    return adaptQqPlaylistDetail(await readPlaylist(playlist.id, options?.signal));
  },

  async getPlaylistTracks(playlist, { offset, limit }, options) {
    const chartId = qqToplistIdOf(playlist.id);
    if (chartId) return readQqToplistTracks(chartId, { offset, limit }, options);
    if (findQqLikedPlaylist(playlist.id)) return readLikedTracks(offset, limit, options?.signal);
    const detail = await readPlaylist(playlist.id, options?.signal);
    const songs = (detail.songlist ?? []).slice(offset, offset + limit);
    return { offset, tracks: songs.map(adaptQqPlaylistSong) };
  },

  async removePlaylistTracks(playlist, tracks) {
    await changeQqPlaylistTrackList(playlist, "del", tracks);
  },
};
