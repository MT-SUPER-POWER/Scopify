import type { MusicArtistSource } from "@scopify/music-domain/artist";
import type { MusicTrack } from "@scopify/music-domain/track";

import { adaptQqArtistAlbum, adaptQqArtistDetail } from "@/lib/providers/qq/adapters/artist";
import { adaptQqPlaylistSong } from "@/lib/providers/qq/adapters/playlist";
import {
  getQqSingerAlbums,
  getQqSingerDetail,
  getQqSingerFans,
  getQqSingerSongs,
} from "@/lib/providers/qq/api/artist";

/** Requests of songs read for the top tracks, which makes up to three times 30 songs. */
const TOP_TRACK_REQUESTS = 3;

export const qqArtistSource: MusicArtistSource = {
  async getArtist(artist, signal) {
    const [detail, followerCount] = await Promise.all([
      getQqSingerDetail(artist.id, signal),
      // The fan count only decorates the page, so losing it must not lose the artist.
      getQqSingerFans(artist.id, signal).catch((error: unknown) => {
        if (signal?.aborted) throw error;
        return null;
      }),
    ]);
    return adaptQqArtistDetail(detail.singer, followerCount);
  },

  async getArtistTopTracks(artist, signal) {
    const tracks: MusicTrack[] = [];
    for (let round = 0; round < TOP_TRACK_REQUESTS; round += 1) {
      const data = await getQqSingerSongs(artist.id, tracks.length, signal);
      tracks.push(...data.songs.map(adaptQqPlaylistSong));
      if (!data.more || data.songs.length === 0) break;
    }
    return tracks;
  },

  async getArtistAlbums(artist, { offset, limit }, signal) {
    const { albums, total } = await getQqSingerAlbums(artist.id, offset, limit, signal);
    const next = offset + albums.length;
    return {
      offset,
      albums: albums.map(adaptQqArtistAlbum),
      nextOffset: albums.length > 0 && total !== null && next < total ? next : null,
    };
  },
};
