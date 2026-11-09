import type { MusicLibrarySource } from "@scopify/music-domain/library";

import {
  adaptQqCloudEntries,
  adaptQqLibraryAlbum,
  adaptQqLibraryPlaylist,
  adaptQqListeningRank,
} from "@/lib/providers/qq/adapters/library";
import {
  createQqPlaylist,
  getQqCloud,
  getQqListeningRank,
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
import type { QqCloudDto, QqLibraryPlaylistEntryDto } from "@/types/providers/qq/libraryApi";

const PAGE_SIZE = 100;

/**
 * The backend's date for a period: `YYYYMMDD` for a day, the Monday of the week for a week,
 * `YYYYMM` for a month; a year takes none and so always means the current one.
 */
function qqRankDate(range: "day" | "week" | "month" | "year", date: string): string | undefined {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day || range === "year") return undefined;
  const pad = (value: number) => String(value).padStart(2, "0");
  if (range === "month") return `${year}${pad(month)}`;
  const target = new Date(year, month - 1, day);
  if (range === "week") target.setDate(target.getDate() - ((target.getDay() + 6) % 7));
  return `${target.getFullYear()}${pad(target.getMonth() + 1)}${pad(target.getDate())}`;
}
/** The backend serves at most 1000 cloud songs per request. */
const CLOUD_PAGE_SIZE = 500;
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

  /** Reads the cloud drive page by page until the backend reports no more. */
  async getCloudEntries(options) {
    const entries: QqCloudDto["data"] = [];
    for (let offset = 0, round = 0; round < MAX_ROUNDS; round += 1) {
      const data = await getQqCloud(offset, CLOUD_PAGE_SIZE, options?.signal);
      entries.push(...data.data);
      if (!data.hasMore) return adaptQqCloudEntries(entries);
      if (data.data.length === 0) throw new Error("QQ cloud list is incomplete.");
      offset += data.data.length;
    }
    throw new Error("QQ cloud list is incomplete.");
  },

  async getListeningRank(range, options) {
    const date = options?.date ? qqRankDate(range, options.date) : undefined;
    return adaptQqListeningRank((await getQqListeningRank(range, date, options?.signal)).items);
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
