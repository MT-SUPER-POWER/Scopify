import { qqClient } from "@/lib/providers/qq/client";
import type { QqFavCountDto, QqSongBatchDto, QqSongLabelsDto } from "@/types/providers/qq/trackApi";

/** POST /song/batch accepts at most this many songs per request. */
export const QQ_SONG_BATCH_LIMIT = 20;

/** Song details for up to {@link QQ_SONG_BATCH_LIMIT} MIDs, one result per MID in order. */
export function getQqSongBatch(mids: readonly string[], signal?: AbortSignal) {
  return qqClient.requestData<QqSongBatchDto>({
    method: "POST",
    url: "/song/batch",
    data: { songs: mids.map((mid) => ({ mid })) },
    signal,
    errorContext: { operation: "qq.song.batch", count: mids.length },
  });
}

export function getQqFavCount(songId: string, signal?: AbortSignal) {
  return qqClient.requestData<QqFavCountDto>({
    method: "GET",
    url: "/song/fav-count",
    params: { ids: songId },
    noSession: true,
    signal,
    errorContext: { operation: "qq.song.favCount", songId },
  });
}

export function getQqSongLabels(songId: string, signal?: AbortSignal) {
  return qqClient.requestData<QqSongLabelsDto>({
    method: "GET",
    url: "/song/labels",
    params: { id: songId },
    noSession: true,
    signal,
    errorContext: { operation: "qq.song.labels", songId },
  });
}
