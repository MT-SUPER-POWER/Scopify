import type { MusicTrackSource } from "@scopify/music-domain/provider";

import { adaptQqTrack } from "@/lib/providers/qq/adapters/track";
import {
  getQqFavCount,
  getQqSongBatch,
  getQqSongLabels,
  QQ_SONG_BATCH_LIMIT,
} from "@/lib/providers/qq/api/track";
import { resolveQqSongId } from "@/lib/providers/qq/songId";
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
  async getTrackLikeCount(track, signal) {
    const data = await getQqFavCount(await resolveQqSongId(track.id, signal), signal);
    return data.items[0]?.count ?? null;
  },

  async getTrackLabels(track, signal) {
    const data = await getQqSongLabels(await resolveQqSongId(track.id, signal), signal);
    return data.labels.map((label) => label.text).filter(Boolean);
  },

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
