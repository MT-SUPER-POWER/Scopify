import type { MusicLibrarySource } from "@scopify/music-domain/library";

import { adaptQqLibraryAlbum, adaptQqLibraryPlaylist } from "@/lib/providers/qq/adapters/library";
import {
  createQqPlaylist,
  deleteQqPlaylist,
  getQqLikedSongs,
  getQqUserAlbums,
  getQqUserPlaylists,
  renameQqPlaylist,
  subscribeQqPlaylist,
} from "@/lib/providers/qq/api/library";
import { rememberQqLikedPlaylists } from "@/lib/providers/qq/likedPlaylist";
import {
  changeQqPlaylistTrackList,
  qqPlaylistName,
  qqPlaylistTid,
  setQqTrackLiked,
} from "@/lib/providers/qq/libraryWrite";
import type { QqLibraryPlaylistEntryDto } from "@/types/providers/qq/libraryApi";

const PAGE_SIZE = 100;
/** A listing that still reports more after this many rounds is treated as broken. */
const MAX_ROUNDS = 50;

export const qqLibrarySource: MusicLibrarySource = {
  async getLibraryPlaylists(account, options) {
    const entries: QqLibraryPlaylistEntryDto[] = [];
    const seen = new Set<number>();
    let favoriteOffset = 0;
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const data = await getQqUserPlaylists(favoriteOffset, options?.signal);
      for (const entry of data.playlist) {
        if (seen.has(entry.tid)) continue;
        seen.add(entry.tid);
        entries.push(entry);
      }
      if (!data.more) {
        const playlists = entries.map((entry) => adaptQqLibraryPlaylist(entry, account));
        rememberQqLikedPlaylists(playlists);
        return playlists;
      }
      // Without a continuation point the backend could not confirm the list whole.
      if (data.nextFavoriteOffset === undefined || data.nextFavoriteOffset <= favoriteOffset) {
        throw new Error("QQ playlist list is incomplete.");
      }
      favoriteOffset = data.nextFavoriteOffset;
    }
    throw new Error("QQ playlist list is incomplete.");
  },

  async getLikedTrackIds(_account, options) {
    const mids = new Set<string>();
    for (let offset = 0, round = 0; round < MAX_ROUNDS * 10; round += 1) {
      const data = await getQqLikedSongs(offset, PAGE_SIZE, options?.signal);
      for (const song of data.songs) mids.add(song.mid);
      if (!data.more) return [...mids];
      if (data.songs.length === 0) throw new Error("QQ liked songs list is incomplete.");
      offset += data.songs.length;
    }
    throw new Error("QQ liked songs list is incomplete.");
  },

  async getLibraryAlbums(_account, options) {
    const albums = [];
    for (let offset = 0, round = 0; round < MAX_ROUNDS; round += 1) {
      const data = await getQqUserAlbums(offset, PAGE_SIZE, options?.signal);
      for (const entry of data.albums) {
        const album = adaptQqLibraryAlbum(entry);
        if (album) albums.push(album);
      }
      if (!data.more) return albums;
      if (data.albums.length === 0) throw new Error("QQ album list is incomplete.");
      offset += data.albums.length;
    }
    throw new Error("QQ album list is incomplete.");
  },

  setTrackLiked: setQqTrackLiked,

  async createPlaylist({ name }) {
    const data = await createQqPlaylist(qqPlaylistName(name));
    return { provider: "qq", kind: "playlist", id: String(data.tid) };
  },

  async renamePlaylist(playlist, name) {
    await renameQqPlaylist(qqPlaylistTid(playlist), qqPlaylistName(name));
  },

  async deletePlaylist(playlist) {
    await deleteQqPlaylist(qqPlaylistTid(playlist));
  },

  async setPlaylistSubscribed(playlist, subscribed) {
    await subscribeQqPlaylist(qqPlaylistTid(playlist), subscribed);
  },

  async addPlaylistTracks(playlist, tracks) {
    await changeQqPlaylistTrackList(playlist, "add", tracks);
  },
};
