import { qqClient } from "@/lib/providers/qq/client";
import type { QqLyricDto } from "@/types/providers/qq/lyricsApi";

/** The line-timed lyric of a song by MID, with its translation when the platform has one. */
export function getQqLyric(songmid: string, signal?: AbortSignal) {
  return qqClient.requestData<QqLyricDto>({
    method: "GET",
    url: "/getLyric",
    params: { songmid, trans: 1 },
    signal,
    errorContext: { operation: "qq.lyric" },
  });
}
