import type { MusicAlbumSource } from "@scopify/music-domain/album";

import { adaptQqAlbum } from "@/lib/providers/qq/adapters/album";
import { getQqAlbum, setQqAlbumSubscribed } from "@/lib/providers/qq/api/album";

export const qqAlbumSource: MusicAlbumSource = {
  async getAlbum(album, signal) {
    return adaptQqAlbum(await getQqAlbum(album.id, signal));
  },

  async setAlbumSubscribed(album, subscribed) {
    await setQqAlbumSubscribed(album.id, subscribed);
  },
};
