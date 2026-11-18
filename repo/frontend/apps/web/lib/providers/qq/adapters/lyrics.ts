import type { MusicLyrics } from "@scopify/music-domain/lyrics";
import type { MusicResourceRef } from "@scopify/music-domain/identity";

import type { QqLyricDto } from "@/types/providers/qq/lyricsApi";

/** At least one `[mm:ss` tag, so ciphertext or noise is not taken for a lyric. */
const LRC_TIME_TAG = /\[\d{1,3}:\d{2}/;

/** The upstream sends the translation as base64 of UTF-8; anything unreadable counts as none. */
function decodeTranslation(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    return LRC_TIME_TAG.test(text) ? text : null;
  } catch {
    return null;
  }
}

export function adaptQqLyric(ref: MusicResourceRef<"track">, dto: QqLyricDto): MusicLyrics {
  const { lyric, trans } = dto.response;
  return {
    ref,
    pureMusic: false,
    lines: {
      original: lyric && LRC_TIME_TAG.test(lyric) ? lyric : null,
      translation: decodeTranslation(trans),
      romanization: null,
    },
    words: null,
  };
}
