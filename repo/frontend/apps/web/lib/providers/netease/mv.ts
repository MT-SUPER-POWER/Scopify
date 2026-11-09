import type { MusicMvSource } from "@scopify/music-domain/mv";

import {
  adaptNeteaseMv,
  adaptNeteaseMvDetail,
  getRelatedMvKeyword,
} from "@/lib/providers/netease/adapters/mv";
import { getMVDetail, getMVUrl } from "@/lib/providers/netease/api/mv";
import { searchMVs } from "@/lib/providers/netease/api/search";
import { getSongDetail } from "@/lib/providers/netease/api/track";

/** The quality asked for when the caller names none: the tallest NetEase serves. */
const DEFAULT_MV_HEIGHT = 1080;

export const neteaseMvSource: MusicMvSource = {
  async getMv(mv, signal) {
    return adaptNeteaseMvDetail((await getMVDetail(mv.id, signal)).data.data);
  },

  async getMvStream(mv, request) {
    const response = await getMVUrl(
      mv.id,
      request?.maxHeight ?? DEFAULT_MV_HEIGHT,
      request?.signal,
    );
    const data = response.data?.data;
    if (!data?.url) return null;
    return { url: data.url, height: data.r || null, qualities: [] };
  },

  async getTrackMvs(track, signal) {
    const response = await getSongDetail(track.id);
    const mvId = response.data?.songs?.[0]?.mv;
    if (!mvId) return [];
    return [adaptNeteaseMv((await getMVDetail(mvId, signal)).data.data)];
  },

  /** The MV page has always found related MVs by searching for the title and the artist. */
  async getRelatedMvs(mv, request) {
    const response = await searchMVs(
      getRelatedMvKeyword(mv),
      request.limit,
      request.offset,
      request.signal,
    );
    const mvs = response.data?.result?.mvs ?? [];
    const total = response.data?.result?.mvCount;
    const next = request.offset + mvs.length;
    return {
      mvs: mvs.map(adaptNeteaseMv),
      hasMore: mvs.length > 0 && (total === undefined || next < total),
    };
  },
};
