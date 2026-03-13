import request from "../web/request";

/**
 * 登录后调用此接口 , 传入用户 id, 可以获取用户歌单
 * @param uid 用户 id
 * @param limit 返回数量 , 默认为 30
 * @param offset 偏移数量，用于分页 , 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
 * @returns
 */
export function getUserPlaylist(uid: number, limit: number = 30, offset: number = 0) {
  return request.get('/user/playlist', { params: { uid, limit, offset } });
}

/**
 * 获取歌单所有歌曲
 * @param id 歌单 id
 * @param limit 限制获取歌曲的数量，默认值为当前歌单的歌曲数量
 * @param offset 偏移量，默认 0
 * @returns 歌曲列表数据
 */
export function getPlaylistAllTracks(id: number | string, limit?: number, offset: number = 0) {
  return request.get('/playlist/track/all', { params: { id, limit, offset } });
}

/**
 * 获取最近播放-歌曲
 * @param limit 返回数量，默认为 10
 * @returns 最近播放的歌曲列表数据
 */
export function getRecentSongs(limit: number = 10) {
  return request.get('/record/recent/song', { params: { limit } });
}

/**
 * 获取所有用户信息的歌曲的 ID
 */
export function getUserLikeLists(uid: number | string) {
  return request.get('/likelist', { params: { uid } });
}

/**
 * 喜欢和取消喜欢
 */
export function likeSong(id: number | string, like: boolean) {
  return request.get('/like', { params: { id, like } });
}
