import type { MusicLyricsSource } from "@scopify/music-domain/lyrics";

import { adaptNeteaseLyric } from "@/lib/providers/netease/adapters/lyrics";
import { getNeteaseLyric } from "@/lib/providers/netease/api/lyrics";

export const neteaseLyricsSource: MusicLyricsSource = {
  async getLyrics(ref, signal) {
    return adaptNeteaseLyric(ref, await getNeteaseLyric(ref.id, signal));
  },
};
