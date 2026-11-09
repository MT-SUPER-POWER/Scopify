import type { MusicAlbumSource } from "@scopify/music-domain/album";

import { adaptNeteaseAlbum } from "@/lib/providers/netease/adapters/album";
import { getAlbumDetailData, subscribeAlbum } from "@/lib/providers/netease/api/album";

export const neteaseAlbumSource: MusicAlbumSource = {
  async getAlbum(album, signal) {
    const data = await getAlbumDetailData(album.id, signal);
    if (!data.album) throw new Error("Album detail is missing.");
    return adaptNeteaseAlbum(data.album, data.songs ?? [], album.id);
  },

  async setAlbumSubscribed(album, subscribed) {
    await subscribeAlbum(album.id, subscribed);
  },
};
