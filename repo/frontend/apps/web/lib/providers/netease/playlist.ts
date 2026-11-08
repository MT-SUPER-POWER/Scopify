import type { MusicPlaylistSource } from "@scopify/music-domain/playlist";

import {
  adaptNeteasePlaylistDetail,
  adaptNeteasePlaylistTracks,
} from "@/lib/providers/netease/adapters/playlist";
import { getPlaylistAllTracks, getPlaylsitDetail } from "@/lib/providers/netease/api/playlist";
import { updatePlaylistTrack } from "@/lib/providers/netease/api/track";

export const neteasePlaylistSource: MusicPlaylistSource = {
  async getPlaylist(playlist, options) {
    const { data } = await getPlaylsitDetail({
      id: playlist.id,
      requiresMusicSession: options?.personal,
    });
    if (!data.playlist) throw new Error("Playlist detail is missing.");
    return adaptNeteasePlaylistDetail(data.playlist, playlist.id);
  },

  async getPlaylistTracks(playlist, { offset, limit }, options) {
    const { data } = await getPlaylistAllTracks({
      id: playlist.id,
      // The first page has always been requested without an offset.
      offset: offset === 0 ? undefined : offset,
      limit,
      requiresMusicSession: options?.personal,
    });
    return { offset, tracks: adaptNeteasePlaylistTracks(data) };
  },

  async removePlaylistTracks(playlist, tracks) {
    if (tracks.length === 0) return;
    await updatePlaylistTrack({
      operation: "del",
      playlistId: playlist.id,
      trackId: tracks.map((track) => track.id).join(","),
    });
  },
};
