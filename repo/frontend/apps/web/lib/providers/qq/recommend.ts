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
  getQqDailyHistory,
  getQqDailyHistoryDates,
  getQqDailySongs,
  getQqCategoryPlaylists,
  getQqGuessYouLike,
  getQqHomeFeed,
  getQqPlaylistCategories,
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

function localDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const qqRecommendSource: MusicRecommendSource = {
  async getDailyTracks(request) {
    // A past day comes from the history route; today's list is the ordinary daily list.
    if (request?.date && request.date !== localDateKey(new Date())) {
      const history = await getQqDailyHistory(request.date, request.signal);
      return history.songs.map(adaptQqPlaylistSong);
    }
    const data = await getQqDailySongs(request?.signal);
    return data.songs.map(adaptQqPlaylistSong);
  },

  async getDailyHistoryDates(options) {
    const data = await getQqDailyHistoryDates(options?.signal);
    return data.dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
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
   * The home feed holds what QQ has beyond the shared home sections (daily songs and the
   * recommended playlists already have theirs): the song shelves of its own feed, "guess you
   * like" and a few playlist categories. Each route may fail alone; the feed fails
   * only when none answers.
   */
  async getHomeFeed(options) {
    const signal = options?.signal;
    const parts = await Promise.allSettled([
      getQqHomeFeed(signal).then(adaptQqHomeFeed),
      getQqGuessYouLike(signal).then((data) => qqSongShelf("guessYouLike", data.songs)),
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
