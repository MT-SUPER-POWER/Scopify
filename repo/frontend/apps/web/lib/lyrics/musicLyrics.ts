import type { MusicLyrics } from "@scopify/music-domain/lyrics";

import { getMusicProvider } from "@/lib/providers";
import type { LyricSource, LyricSourceBranch } from "@/types/lyrics/model";

/** A branch entry only for a text the platform served, so absent texts stay absent. */
function branch<Key extends string>(
  key: Key,
  text: string | null | undefined,
): { [K in Key]?: LyricSourceBranch } {
  return text == null
    ? {}
    : ({ [key]: { version: 1, lyric: text } } as { [K in Key]?: LyricSourceBranch });
}

/**
 * The lyric texts the renderer reads, from a provider's lyrics. Only the texts a platform
 * served are present, so the renderer's own fallbacks (word timing to line timing) apply.
 */
export function musicLyricsToSource(lyrics: MusicLyrics): LyricSource {
  const { lines, words } = lyrics;
  return {
    code: 200,
    ...(lyrics.pureMusic ? { pureMusic: true } : {}),
    ...branch("lrc", lines.original),
    ...branch("tlyric", lines.translation),
    ...branch("romalrc", lines.romanization),
    ...branch("yrc", words?.original),
    ...branch("ytlrc", words?.translation),
    ...branch("yromalrc", words?.romanization),
  };
}

/** The lyric of a NetEase song by ID, for NetEase-only flows such as matching a lyric to another song. */
export async function getNeteaseLyricSource(
  songId: number | string,
  signal?: AbortSignal,
): Promise<LyricSource> {
  const lyrics = await getMusicProvider("netease").getLyrics(
    { provider: "netease", kind: "track", id: String(songId) },
    signal,
  );
  return musicLyricsToSource(lyrics);
}
