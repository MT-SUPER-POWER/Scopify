import type { MusicTrackSource } from "@scopify/music-domain/provider";

import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { requestData } from "@/lib/providers/netease/client";
import type { NeteaseSongDetailDto } from "@/types/providers/netease/trackApi";

export const neteaseTrackSource: MusicTrackSource = {
  async getTracks(ids, signal) {
    if (ids.length === 0) return [];
    const data = await requestData<NeteaseSongDetailDto>({
      url: "/song/detail",
      params: { ids: ids.join(",") },
      signal,
    });
    const byId = new Map((data.songs ?? []).map((song) => [String(song.id), song]));
    return ids.flatMap((id) => {
      const song = byId.get(id);
      return song ? [adaptNeteaseTrack(song)] : [];
    });
  },
};
