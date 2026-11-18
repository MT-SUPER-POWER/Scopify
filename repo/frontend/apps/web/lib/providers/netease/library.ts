import type { MusicLibrarySource } from "@scopify/music-domain/library";

import {
  adaptNeteaseLibraryAlbum,
  adaptNeteaseLibraryPlaylist,
} from "@/lib/providers/netease/adapters/library";
import { getUserAlbumSublist } from "@/lib/providers/netease/api/album";
import {
  createPlaylist,
  delPlaylist,
  getUserLikeLists,
  getUserPlaylist,
  likeSong,
  renamePlaylist,
  subscribePlaylist,
} from "@/lib/providers/netease/api/playlist";
import { updatePlaylistTrack } from "@/lib/providers/netease/api/track";
import { ApiError } from "@/lib/web/apiError";
import type { RawNeteasePlaylist } from "@/types/providers/netease/playlistApi";

/** Fetch every page before presenting a library order for editing. */
export async function fetchNeteaseUserPlaylists(userId: number): Promise<RawNeteasePlaylist[]> {
  const playlists: RawNeteasePlaylist[] = [];
  const seen = new Set<number>();
  for (let offset = 0; ; offset += 100) {
    const { data } = await getUserPlaylist(userId, 100, offset);
    if (data.code !== 200 || !Array.isArray(data.playlist)) {
      throw new Error("Unable to load playlists.");
    }
    for (const playlist of data.playlist) {
      if (!playlist.id || seen.has(playlist.id))
        throw new Error("Playlist list changed. Please reload.");
      seen.add(playlist.id);
      playlists.push(playlist);
    }
    if (!data.more) return playlists;
    if (data.playlist.length === 0) throw new Error("Incomplete playlist list.");
  }
}

/**
 * The liked-songs playlist is the one NetEase marks with special type 5. Older accounts
 * lack the mark, so the "liked music" playlist by name, then the first one the account
 * created, stands in for it.
 */
function findLikedPlaylist(playlists: RawNeteasePlaylist[], userId: number) {
  return (
    playlists.find((playlist) => playlist.specialType === 5) ??
    playlists.find(
      (playlist) => playlist.name?.includes("喜欢") && playlist.name?.includes("音乐"),
    ) ??
    playlists.find((playlist) => playlist.creator?.userId === userId) ??
    playlists[0]
  );
}

function requireSuccess(response: { data: { code: number; message?: string } }, action: string) {
  if (response.data.code !== 200) {
    throw new ApiError({
      kind: "business",
      data: response.data,
      message: response.data.message || `NetEase ${action} failed.`,
    });
  }
}

function userIdOf(accountId: string): number {
  const userId = Number(accountId);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("Invalid NetEase account.");
  return userId;
}

export const neteaseLibrarySource: MusicLibrarySource = {
  async getLibraryPlaylists(account) {
    const userId = userIdOf(account.accountId);
    const raw = await fetchNeteaseUserPlaylists(userId);
    const likedList = findLikedPlaylist(raw, userId);
    return raw.map((playlist) => ({
      ...adaptNeteaseLibraryPlaylist(playlist, account),
      isLikedList: playlist === likedList,
    }));
  },

  async getLikedTrackIds(account) {
    const { data } = await getUserLikeLists(userIdOf(account.accountId));
    if (!Array.isArray(data.ids)) throw new Error("Unable to load liked songs.");
    return data.ids.map(String);
  },

  async getLibraryAlbums() {
    const { data } = await getUserAlbumSublist({ limit: 100 });
    return (data.data ?? []).map(adaptNeteaseLibraryAlbum);
  },

  async setTrackLiked(track, liked) {
    await likeSong(track.id, liked);
  },

  async createPlaylist({ name, visibility }) {
    const response = await createPlaylist(name, visibility === "private" ? "10" : "0");
    requireSuccess(response, "playlist create");
    const id = response.data.playlist?.id;
    return id === undefined ? null : { provider: "netease", kind: "playlist", id: String(id) };
  },

  async renamePlaylist(playlist, name) {
    requireSuccess(await renamePlaylist(playlist.id, name), "playlist rename");
  },

  async deletePlaylist(playlist) {
    requireSuccess(await delPlaylist(playlist.id), "playlist delete");
  },

  async setPlaylistSubscribed(playlist, subscribed) {
    requireSuccess(await subscribePlaylist(subscribed ? 1 : 2, playlist.id), "playlist subscribe");
  },

  async addPlaylistTracks(playlist, tracks) {
    if (tracks.length === 0) return;
    await updatePlaylistTrack({
      operation: "add",
      playlistId: playlist.id,
      trackId: tracks.map((track) => track.id).join(","),
    });
  },
};
