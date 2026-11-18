import { requestData } from "@/lib/providers/netease/client";
import type { NeteaseLyricDto } from "@/types/providers/netease/lyricsApi";

/** The lyric texts of a song: line-timed, word-timed, translated and romanized. */
export function getNeteaseLyric(id: number | string, signal?: AbortSignal) {
  return requestData<NeteaseLyricDto>({ url: "/lyric/new", params: { id }, signal });
}
