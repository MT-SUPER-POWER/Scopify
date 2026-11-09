import type { MusicMvPage, MusicMvSource } from "@scopify/music-domain/mv";

import { adaptQqMv, adaptQqMvDetail, adaptQqMvStream } from "@/lib/providers/qq/adapters/mv";
import { getQqMvDetail, getQqMvList, getQqMvUrl, getQqSongMvs } from "@/lib/providers/qq/api/mv";
import { resolveQqSongId } from "@/lib/providers/qq/songId";
import { isApiError } from "@/lib/web/apiError";

const EMPTY_PAGE: MusicMvPage = { mvs: [], hasMore: false };

/** The backend answers 422 for an empty list and for an MV with no playable file. */
function isEmpty(error: unknown): boolean {
  return isApiError(error) && (error.status === 422 || error.status === 404);
}

export const qqMvSource: MusicMvSource = {
  async getMv(mv, signal) {
    return adaptQqMvDetail((await getQqMvDetail(mv.id, signal)).mv);
  },

  async getMvStream(mv, request) {
    try {
      return adaptQqMvStream(await getQqMvUrl(mv.id, request?.signal), request?.maxHeight);
    } catch (error) {
      if (isEmpty(error)) return null;
      throw error;
    }
  },

  async getTrackMvs(track, signal) {
    const songId = await resolveQqSongId(track.id, signal);
    try {
      return (await getQqSongMvs(songId, signal)).mvs.map(adaptQqMv);
    } catch (error) {
      if (isEmpty(error)) return [];
      throw error;
    }
  },

  /** QQ has no related-MV route, so the MVs it lists most prominently stand in. */
  async getRelatedMvs(_mv, request) {
    try {
      const data = await getQqMvList(request, request.signal);
      return { mvs: data.mvs.map(adaptQqMv), hasMore: data.more };
    } catch (error) {
      if (isEmpty(error)) return EMPTY_PAGE;
      throw error;
    }
  },
};
