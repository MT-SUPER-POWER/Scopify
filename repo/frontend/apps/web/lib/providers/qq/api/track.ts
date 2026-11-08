import { qqClient } from "@/lib/providers/qq/client";
import type { QqSongBatchDto } from "@/types/providers/qq/trackApi";

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
