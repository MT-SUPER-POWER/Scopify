import type { MusicRecommendSource } from "@scopify/music-domain/recommend";

import {
  adaptNeteaseNewAlbums,
  adaptNeteaseNewSongs,
  adaptNeteaseRecommendedPlaylists,
  adaptNeteaseRecommendedSongs,
  adaptNeteaseToplists,
} from "@/lib/providers/netease/adapters/recommend";
import { getNewestAlbums } from "@/lib/providers/netease/api/album";
import { getHotArtists } from "@/lib/providers/netease/api/artist";
import { getPersonalizedNewSongs } from "@/lib/providers/netease/api/music";
import {
  getPersonalFm,
  getPersonalFmByMode,
  trashPersonalFmSong,
} from "@/lib/providers/netease/api/personalFm";
import {
  getHistoricalDailyRecommendationDetail,
  getPersonalizePlaylists,
  getRecommendedPlaylists,
} from "@/lib/providers/netease/api/playlist";
import { getToplistDetail } from "@/lib/providers/netease/api/toplist";
import { getRecommendedSongs } from "@/lib/providers/netease/api/track";
import type { HistoricalDailyRecommendationDetailResponse } from "@/types/playlist/api";
import type { RawSongDetail } from "@/types/song/api";

function getHistoricalSongs(
  response: HistoricalDailyRecommendationDetailResponse,
): RawSongDetail[] {
  const songs = response.data?.dailySongs ?? response.data?.songs;
  return Array.isArray(songs) ? songs : [];
}

export const neteaseRecommendSource: MusicRecommendSource = {
  async getDailyTracks(request) {
    const songs: RawSongDetail[] = request?.date
      ? getHistoricalSongs((await getHistoricalDailyRecommendationDetail(request.date)).data)
      : ((await getRecommendedSongs()).data?.data?.dailySongs ?? []);
    return adaptNeteaseRecommendedSongs(songs);
  },

  async getPersonalFmTracks(request) {
    const fetchDefault = async () => (await getPersonalFm()).data;
    const mode = request?.mode;
    let response;

    if (!mode || mode === "DEFAULT") {
      response = await fetchDefault();
    } else {
      try {
        const modeResponse = await getPersonalFmByMode({
          mode,
          ...(mode === "SCENE_RCMD" && request.scene ? { submode: request.scene } : {}),
        });
        response = modeResponse.data;
        if (!Array.isArray(response.data) || response.data.length === 0) {
          response = await fetchDefault();
        }
      } catch (error) {
        console.warn("[personal-fm] mode endpoint unavailable, using default FM", error);
        response = await fetchDefault();
      }
    }

    return adaptNeteaseRecommendedSongs(Array.isArray(response.data) ? response.data : []);
  },

  async dislikePersonalFmTrack(track) {
    await trashPersonalFmSong(track.id);
  },

  async getFeaturedPlaylists(limit) {
    return adaptNeteaseRecommendedPlaylists((await getPersonalizePlaylists(limit)).data.result);
  },

  async getRecommendedPlaylists() {
    return adaptNeteaseRecommendedPlaylists((await getRecommendedPlaylists()).data.recommend);
  },

  async getToplists() {
    return adaptNeteaseToplists((await getToplistDetail()).data.list);
  },

  async getFeaturedArtists(limit) {
    const artists = (await getHotArtists(limit)).data.artists ?? [];
    return artists.map((artist) => ({
      ref: { provider: "netease", kind: "artist", id: String(artist.id) },
      name: artist.name,
      avatarUrl: artist.picUrl || artist.img1v1Url || null,
    }));
  },

  async getNewTracks(limit) {
    return adaptNeteaseNewSongs((await getPersonalizedNewSongs(limit)).data.result);
  },

  async getNewAlbums() {
    return adaptNeteaseNewAlbums((await getNewestAlbums()).data.albums);
  },
};
