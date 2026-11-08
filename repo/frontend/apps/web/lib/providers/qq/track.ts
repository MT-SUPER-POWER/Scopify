import type { MusicTrackSource } from "@scopify/music-domain/provider";

import { adaptQqTrack } from "@/lib/providers/qq/adapters/track";
import { getQqSongBatch, QQ_SONG_BATCH_LIMIT } from "@/lib/providers/qq/api/track";
import { isApiError } from "@/lib/web/apiError";
import type { QqTrackDto } from "@/types/providers/qq/trackApi";

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export const qqTrackSource: MusicTrackSource = {
  async getTracks(mids, signal) {
    const batches = await Promise.all(
      chunk(mids, QQ_SONG_BATCH_LIMIT).map(async (batch) => {
        try {
          const data = await getQqSongBatch(batch, signal);
          return data.results.flatMap((entry): QqTrackDto[] =>
            entry.code === 200 && "song" in entry ? [entry.song] : [],
          );
        } catch (error) {
          // The batch fails as a whole only when no song in it resolves.
          if (isApiError(error) && error.status === 404) return [];
          throw error;
        }
      }),
    );
    return batches.flat().map(adaptQqTrack);
  },
};
