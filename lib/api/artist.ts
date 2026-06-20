import type { FollowedArtistsResponse } from "@/types/api/artist";
import request from "../web/request";

/**
 * 获取歌手详情
 */
export function getRecommendedSongs(id: number | string) {
  return request.get("/artists/detail", {
    params: { id },
  });
}

/**
 * 获取热门歌手列表
 */
export function getHotArtists(limit: number = 10) {
  return request.get("/top/artists", {
    params: { limit },
  });
}

/**
 * 获取歌手详情（含 briefDesc、cover 等）
 */
export function getAritstDetail(id: number | string) {
  return request.get("/artist/detail", {
    params: { id },
  });
}

/**
 * 获取歌手粉丝数
 */
export function getFansCnt(id: number | string) {
  return request.get("/artist/follow/count", {
    params: { id },
  });
}

/**
 * 获取歌手热门歌曲
 */
export function getArtistTopSongs(id: number | string) {
  return request.get("/v1/artist/songs", {
    params: { id },
  });
}

/**
 * 获取歌手专辑列表
 * @param id 歌手 id
 * @param limit 数量，默认 30
 * @param offset 分页偏移
 */
export function getArtistAlbums(id: number | string, limit = 10, offset = 0) {
  return request.get("/artist/album", {
    params: { id, limit, offset },
  });
}

/**
 * 获取歌手 MV 列表
 */
export function getArtistMVs(id: number | string) {
  return request.get("/artist/mv", {
    params: { id },
  });
}

/**
 * 获取已关注歌手列表
 */
export function getFollowedArtists(limit = 20, offset = 0) {
  return request.get<FollowedArtistsResponse>("/artist/sublist", {
    params: { limit, offset },
  });
}

/**
 * 收藏/取消收藏歌手
 * @param id 歌手 id
 * @param sub true=收藏, false=取消收藏
 */
export function subscribeArtist(id: number | string, sub: boolean) {
  return request.get("/artist/sub", {
    params: { id, t: sub ? 1 : 0 },
  });
}
