import type { MusicRecommendSource } from "@scopify/music-domain/recommend";

import { adaptQqPlaylistSong } from "@/lib/providers/qq/adapters/playlist";
import {
  adaptQqFeaturedArtists,
  adaptQqHomeFeed,
  adaptQqNewAlbums,
  adaptQqRecommendPlaylists,
  adaptQqToplists,
} from "@/lib/providers/qq/adapters/recommend";
import {
  getQqDailySongs,
  getQqHomeFeed,
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

  async getHomeFeed(options) {
    return adaptQqHomeFeed(await getQqHomeFeed(options?.signal));
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
