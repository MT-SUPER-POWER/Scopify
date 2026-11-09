import type { MusicRecommendSource } from "@scopify/music-domain/recommend";

import { adaptQqPlaylistSong } from "@/lib/providers/qq/adapters/playlist";
import {
  adaptQqFeaturedArtists,
  adaptQqHomeFeed,
  qqCategoryShelf,
  qqSongShelf,
  adaptQqNewAlbums,
  adaptQqRecommendPlaylists,
  adaptQqToplists,
} from "@/lib/providers/qq/adapters/recommend";
import {
  getQqDailySongs,
  getQqCategoryPlaylists,
  getQqGuessYouLike,
  getQqHomeFeed,
  getQqPlaylistCategories,
  getQqRadar,
  getQqNewAlbums,
  getQqNewSongs,
  getQqPopularSingers,
  getQqPersonalFm,
  getQqRecommendPlaylists,
  getQqToplists,
} from "@/lib/providers/qq/api/recommend";

/**
 * Where the next personal FM batch starts. The backend keeps no stream of its own: it serves
 * the page asked for and names the next one, so the pages walk on from batch to batch and
 * start over when the station reports no more.
 */
let nextPersonalFmPage = 1;

export const qqRecommendSource: MusicRecommendSource = {
  async getDailyTracks(request) {
    const data = await getQqDailySongs(request?.signal);
    return data.songs.map(adaptQqPlaylistSong);
  },

  async getPersonalFmTracks(request) {
    const data = await getQqPersonalFm(nextPersonalFmPage, request?.signal);
    nextPersonalFmPage = data.nextPage ?? 1;
    return data.songs.map(adaptQqPlaylistSong);
  },

  async getFeaturedPlaylists(limit, options) {
    const data = await getQqRecommendPlaylists(limit, false, options?.signal);
    return adaptQqRecommendPlaylists(data.playlists);
  },

  async getRecommendedPlaylists(options) {
    const data = await getQqRecommendPlaylists(25, true, options?.signal);
    return adaptQqRecommendPlaylists(data.playlists);
  },

  async getToplists(options) {
    return adaptQqToplists(await getQqToplists(options?.signal));
  },

  /**
   * The home feed is assembled from several QQ routes, each of which may fail alone: the
   * platform's own shelves, the daily 30, "guess you like", the radar and a few playlist
   * categories. It fails only when none of them answers.
   */
  async getHomeFeed(options) {
    const signal = options?.signal;
    const parts = await Promise.allSettled([
      getQqHomeFeed(signal).then(adaptQqHomeFeed),
      getQqDailySongs(signal).then((data) => qqSongShelf("daily", data.songs)),
      getQqGuessYouLike(signal).then((data) => qqSongShelf("guessYouLike", data.songs)),
      getQqRadar(signal).then((data) => qqSongShelf("radar", data.songs)),
      getQqPlaylistCategories(signal).then(async (data) => {
        const categories = (data.groups[0]?.categories ?? []).slice(0, 3);
        const shelves = await Promise.allSettled(
          categories.map(async (category) =>
            qqCategoryShelf(
              category,
              (await getQqCategoryPlaylists(category.id, 12, signal)).playlists,
            ),
          ),
        );
        return shelves.flatMap((shelf) => (shelf.status === "fulfilled" ? shelf.value : []));
      }),
    ]);
    const shelves = parts.flatMap((part) => (part.status === "fulfilled" ? part.value : []));
    const failed = parts.find((part) => part.status === "rejected");
    if (shelves.length === 0 && failed?.status === "rejected") throw failed.reason;
    return shelves;
  },

  async getFeaturedArtists(limit, options) {
    const data = await getQqPopularSingers(options?.signal);
    return adaptQqFeaturedArtists(data.singers.slice(0, limit));
  },

  async getNewTracks(limit, options) {
    const data = await getQqNewSongs(options?.signal);
    return data.songs.slice(0, limit).map(adaptQqPlaylistSong);
  },

  async getNewAlbums(limit, options) {
    const data = await getQqNewAlbums(limit, options?.signal);
    return adaptQqNewAlbums(data.albums);
  },
};
