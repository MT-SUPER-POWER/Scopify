import { qqClient } from "@/lib/providers/qq/client";
import type {
  QqNewAlbumsDto,
  QqDailySongsDto,
  QqNewSongsDto,
  QqPersonalFmDto,
  QqRecommendPlaylistsDto,
  QqToplistSongsDto,
  QqCategoryPlaylistsDto,
  QqFeedDto,
  QqPlaylistCategoriesDto,
  QqSongBatchStationDto,
  QqSingerListDto,
  QqToplistsDto,
} from "@/types/providers/qq/recommendApi";

/** Playlists QQ recommends; `withSession` reads them as the signed-in account sees them. */
export function getQqRecommendPlaylists(limit: number, withSession: boolean, signal?: AbortSignal) {
  return qqClient.requestData<QqRecommendPlaylistsDto>({
    method: "GET",
    url: "/recommend/playlists",
    params: { limit },
    noSession: !withSession,
    signal,
    errorContext: { operation: "qq.recommend.playlists", withSession },
  });
}

export function getQqNewSongs(signal?: AbortSignal) {
  return qqClient.requestData<QqNewSongsDto>({
    method: "GET",
    url: "/recommend/new-songs",
    noSession: true,
    signal,
    errorContext: { operation: "qq.recommend.newSongs" },
  });
}

export function getQqNewAlbums(limit: number, signal?: AbortSignal) {
  return qqClient.requestData<QqNewAlbumsDto>({
    method: "GET",
    url: "/recommend/new-albums",
    params: { limit },
    noSession: true,
    signal,
    errorContext: { operation: "qq.recommend.newAlbums" },
  });
}

export function getQqDailySongs(signal?: AbortSignal) {
  return qqClient.requestData<QqDailySongsDto>({
    method: "GET",
    url: "/user/daily-songs",
    signal,
    errorContext: { operation: "qq.recommend.dailySongs" },
  });
}

export function getQqPersonalFm(page: number, signal?: AbortSignal) {
  return qqClient.requestData<QqPersonalFmDto>({
    method: "GET",
    url: "/user/personal-fm",
    params: { page },
    signal,
    errorContext: { operation: "qq.recommend.personalFm", page },
  });
}

export function getQqToplists(signal?: AbortSignal) {
  return qqClient.requestData<QqToplistsDto>({
    method: "GET",
    url: "/recommend/toplists",
    noSession: true,
    signal,
    errorContext: { operation: "qq.recommend.toplists" },
  });
}

/** Songs of one chart, from `offset`. An empty `period` asks for the latest issue. */
export function getQqToplistSongs(
  id: string,
  page: { offset: number; limit: number },
  signal?: AbortSignal,
) {
  return qqClient.requestData<QqToplistSongsDto>({
    method: "GET",
    url: "/recommend/toplist",
    params: { id, offset: page.offset, limit: page.limit },
    noSession: true,
    signal,
    errorContext: { operation: "qq.recommend.toplistSongs", id },
  });
}

/** Popular singers, no account needed. */
export function getQqPopularSingers(signal?: AbortSignal) {
  return qqClient.requestData<QqSingerListDto>({
    method: "GET",
    url: "/singer/list",
    noSession: true,
    signal,
    errorContext: { operation: "qq.recommend.singers" },
  });
}

/** The signed-in account's home feed. */
export function getQqHomeFeed(signal?: AbortSignal) {
  return qqClient.requestData<QqFeedDto>({
    method: "GET",
    url: "/recommend/feed",
    signal,
    errorContext: { operation: "qq.recommend.feed" },
  });
}

/** One batch of the account's "guess you like" station. */
export function getQqGuessYouLike(signal?: AbortSignal) {
  return qqClient.requestData<QqSongBatchStationDto>({
    method: "GET",
    url: "/user/guess-you-like",
    signal,
    errorContext: { operation: "qq.recommend.guessYouLike" },
  });
}

/** One batch of the official radar, which anyone can read. */
export function getQqRadar(signal?: AbortSignal) {
  return qqClient.requestData<QqSongBatchStationDto>({
    method: "GET",
    url: "/recommend/radar",
    params: { page: 1 },
    signal,
    errorContext: { operation: "qq.recommend.radar" },
  });
}

export function getQqPlaylistCategories(signal?: AbortSignal) {
  return qqClient.requestData<QqPlaylistCategoriesDto>({
    method: "GET",
    url: "/recommend/categories",
    noSession: true,
    signal,
    errorContext: { operation: "qq.recommend.categories" },
  });
}

export function getQqCategoryPlaylists(id: number, limit: number, signal?: AbortSignal) {
  return qqClient.requestData<QqCategoryPlaylistsDto>({
    method: "GET",
    url: "/recommend/category-playlists",
    params: { id, limit },
    noSession: true,
    signal,
    errorContext: { operation: "qq.recommend.categoryPlaylists", id },
  });
}
