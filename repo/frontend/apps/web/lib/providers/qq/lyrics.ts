import type { MusicLyricsSource } from "@scopify/music-domain/lyrics";

import { adaptQqLyric } from "@/lib/providers/qq/adapters/lyrics";
import { getQqLyric } from "@/lib/providers/qq/api/lyrics";

export const qqLyricsSource: MusicLyricsSource = {
  async getLyrics(ref, signal) {
    return adaptQqLyric(ref, await getQqLyric(ref.id, signal));
  },
};
