import type { MusicArtistSource } from "@scopify/music-domain/artist";

import {
  adaptNeteaseArtistAlbum,
  adaptNeteaseArtistDetail,
} from "@/lib/providers/netease/adapters/artist";
import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import {
  getAritstDetail,
  getArtistAlbums,
  getArtistTopSongs,
  getFansCnt,
  subscribeArtist,
} from "@/lib/providers/netease/api/artist";
import { pruneSongDetail } from "@/types/song/api";

export const neteaseArtistSource: MusicArtistSource = {
  async getArtist(artist, signal) {
    const [detail, followerCount] = await Promise.all([
      getAritstDetail(artist.id, signal),
      // The fan count only decorates the page, so losing it must not lose the artist.
      getFansCnt(artist.id, signal)
        .then((response) => response.data.data?.fansCnt ?? null)
        .catch((error: unknown) => {
          if (signal?.aborted) throw error;
          return null;
        }),
    ]);
    const raw = detail.data.data?.artist;
    if (!raw) throw new Error("Artist detail is missing.");
    return adaptNeteaseArtistDetail(raw, followerCount);
  },

  async getArtistTopTracks(artist, signal) {
    const { data } = await getArtistTopSongs(artist.id, 200, signal);
    return (data.songs ?? []).map((song) => adaptNeteaseTrack(pruneSongDetail(song)));
  },

  async getArtistAlbums(artist, { offset, limit }, signal) {
    const { data } = await getArtistAlbums(artist.id, limit, offset, signal);
    const albums = (data.hotAlbums ?? []).map(adaptNeteaseArtistAlbum);
    return {
      offset,
      albums,
      nextOffset: data.more && albums.length > 0 ? offset + albums.length : null,
    };
  },

  async getArtistFollowState(artist, signal) {
    const { data } = await getFansCnt(artist.id, signal);
    return {
      followed: Boolean(data.data?.isFollow ?? data.data?.follow),
      followerCount: data.data?.fansCnt ?? null,
    };
  },

  async setArtistFollowed(artist, followed) {
    await subscribeArtist(artist.id, followed);
  },
};
