// 歌曲评论接口
import request from "../web/request";

export async function getSongDetail(ids: number | string) {
  return request.get("/song/detail", {
    params: {
      ids,
    },
  });
}

/**
 *
 * @param op: 从歌单增加单曲为 add, 删除为 del
 * @param pid: 歌单 id
 * @param track 歌曲 id,可多个,用逗号隔开
 */
export async function updatePlaylistTrack(
  op: "add" | "del",
  pid: number | string,
  tracks: number | string,
) {
  return request.get("/playlist/tracks", {
    params: { op: op, pid: pid, tracks: tracks },
  });
}

/**
 * 获取推荐歌曲
 */
export function getRecommendedSongs() {
  return request.get("/recommend/songs", {
    params: {
      cookie: localStorage.getItem("music_cookie") || "",
    },
  });
}
