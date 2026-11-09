import { qqClient } from "@/lib/providers/qq/client";
import type {
  QqCloudDto,
  QqLikedSongsDto,
  QqListeningRankDto,
  QqPlaylistCreateDto,
  QqPlaylistTracksWriteDto,
  QqPlaylistWriteDto,
  QqSongLikeDto,
  QqUserAlbumsDto,
  QqUserPlaylistsDto,
} from "@/types/providers/qq/libraryApi";

/** The account's created playlists first, then a run of its saved ones from `favoriteOffset`. */
export function getQqUserPlaylists(favoriteOffset: number, signal?: AbortSignal) {
  return qqClient.requestData<QqUserPlaylistsDto>({
    url: "/user/playlist",
    params: favoriteOffset > 0 ? { favoriteOffset } : undefined,
    signal,
    errorContext: { operation: "qq.library.playlists", favoriteOffset },
  });
}

/** A page of the built-in "liked songs" list; the backend caps a page at 100 songs. */
export function getQqLikedSongs(offset: number, limit: number, signal?: AbortSignal) {
  return qqClient.requestData<QqLikedSongsDto>({
    url: "/user/liked-songs",
    params: { offset, limit },
    signal,
    errorContext: { operation: "qq.library.liked", offset },
  });
}

export function getQqUserAlbums(offset: number, limit: number, signal?: AbortSignal) {
  return qqClient.requestData<QqUserAlbumsDto>({
    url: "/user/albums",
    params: { offset, limit },
    signal,
    errorContext: { operation: "qq.library.albums", offset },
  });
}

/** Likes or unlikes a song; the backend needs both of its identifiers and checks they match. */
export function setQqSongLiked(song: { id: number; mid: string }, liked: boolean) {
  return qqClient.requestData<QqSongLikeDto>({
    method: "POST",
    url: "/user/song/like",
    data: { song: { id: song.id, mid: song.mid, type: 0 }, liked },
    errorContext: { operation: "qq.library.like", mid: song.mid, liked },
  });
}

export function createQqPlaylist(name: string) {
  return qqClient.requestData<QqPlaylistCreateDto>({
    method: "POST",
    url: "/user/playlist/create",
    data: { name },
    errorContext: { operation: "qq.library.playlist.create" },
  });
}

export function renameQqPlaylist(tid: number, name: string) {
  return qqClient.requestData<QqPlaylistWriteDto>({
    method: "POST",
    url: "/user/playlist/rename",
    data: { tid, name },
    errorContext: { operation: "qq.library.playlist.rename", tid },
  });
}

export function deleteQqPlaylist(tid: number) {
  return qqClient.requestData<QqPlaylistWriteDto>({
    method: "POST",
    url: "/user/playlist/delete",
    data: { tid },
    errorContext: { operation: "qq.library.playlist.delete", tid },
  });
}

export function subscribeQqPlaylist(tid: number, subscribed: boolean) {
  return qqClient.requestData<QqPlaylistWriteDto>({
    method: "POST",
    url: "/user/playlist/subscribe",
    data: { tid, subscribed },
    errorContext: { operation: "qq.library.playlist.subscribe", tid, subscribed },
  });
}

/** Adds or removes up to 100 songs of a playlist the account created. */
export function changeQqPlaylistTracks(tid: number, op: "add" | "del", songIds: readonly number[]) {
  return qqClient.requestData<QqPlaylistTracksWriteDto>({
    method: "POST",
    url: "/user/playlist/tracks",
    data: { tid, op, songs: songIds.map((id) => ({ id, type: 0 })) },
    errorContext: { operation: "qq.library.playlist.tracks", tid, op, count: songIds.length },
  });
}

/** A page of the cloud drive; the backend serves at most 1000 songs per request. */
export function getQqCloud(offset: number, limit: number, signal?: AbortSignal) {
  return qqClient.requestData<QqCloudDto>({
    url: "/user/cloud",
    params: { offset, limit },
    signal,
    errorContext: { operation: "qq.library.cloud", offset },
  });
}

/** The account's ranking for a day, week, month or year; `date` is the backend's own format. */
export function getQqListeningRank(
  range: QqListeningRankDto["range"],
  date: string | undefined,
  signal?: AbortSignal,
) {
  return qqClient.requestData<QqListeningRankDto>({
    url: "/user/listening-rank",
    params: { range, ...(date ? { date } : {}) },
    signal,
    errorContext: { operation: "qq.library.listeningRank", range },
  });
}
