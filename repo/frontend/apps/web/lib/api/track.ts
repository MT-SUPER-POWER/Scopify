// 歌曲评论接口
import type { SongRedCountResponse } from "@/types/api/music";
import type {
  PlaylistTrackMutationVariables,
  PlaylistTrackUpdateResponse,
} from "@/types/api/playlist";

import request, { requestConfig, requestData } from "../web/request";

export async function getSongDetail(ids: number | string) {
  return request.get("/song/detail", {
    params: {
      ids,
    },
  });
}

/** 歌曲红心（喜欢）数量 */
export function getSongRedCount(id: number | string) {
  return request.get<SongRedCountResponse>("/song/red/count", {
    params: { id },
  });
}

/**
 *
 * @param op: 从歌单增加单曲为 add, 删除为 del
 * @param pid: 歌单 id
 * @param track 歌曲 id,可多个,用逗号隔开
 */
export function updatePlaylistTrack({
  operation,
  playlistId,
  trackId,
}: PlaylistTrackMutationVariables): Promise<PlaylistTrackUpdateResponse> {
  return requestData<PlaylistTrackUpdateResponse>(
    requestConfig({
      errorContext: {
        action: `playlist.track.${operation}`,
        playlistId,
        trackId,
      },
      expectedBusinessCodes: [200],
      method: "get",
      params: { op: operation, pid: playlistId, tracks: trackId },
      url: "/playlist/tracks",
    }),
  );
}

/**
 * 获取推荐歌曲
 */
export function getRecommendedSongs() {
  return request.get("/recommend/songs", requestConfig({ requiresMusicSession: true }));
}
