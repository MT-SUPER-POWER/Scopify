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
 * 传入用户 id, 可以获取用户创建的歌单
 * @param uid 用户 id
 * @param limit 返回数量 , 默认为 30
 * @param offset 偏移数量，用于分页 , 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
 * @returns
 */
export function getUserPlaylistByID(uid: number, limit: number = 30, offset: number = 0) {
  return request.get('/user/playlist/create', { params: { uid, limit, offset } });
}

/**
 * 获取歌单所有歌曲
 * @param id 歌单 id
 * @param limit 限制获取歌曲的数量，默认值为当前歌单的歌曲数量
 * @param offset 偏移量，默认 0
 * @param cookie 请求推荐歌单数据的时候，目前只有这个完整才能拿到数据
 * @returns 歌曲列表数据
 */
export function getPlaylistAllTracks({ id, limit, offset, cookie }: { id: number | string, limit?: number, offset?: number, cookie?: string }) {
  return request.get('/playlist/track/all', { params: { id, limit, offset, cookie: cookie } });
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
 * 获取用户喜欢的歌曲列表
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


/**
 *
 * @param name
 * @param privacy 默认为为公开 10 为私密 0 为普通歌单
 * @returns
 */
export function createPlaylist(name: string, privacy: string = '0') {
  return request.get('/playlist/create', { params: { name, privacy } });
}


/**
 *
 * @param id 被删除的歌单 id
 * @returns
 */
export function delPlaylist(id: number | string) {
  return request.get('/playlist/delete', { params: { id } });
}


// 收藏/取消收藏歌单 (t: 1收藏, 2取消)
export function subscribePlaylist(t: 1 | 2, id: number | string) {
  return request.get(`/playlist/subscribe`, {
    params: { t, id }
  });
}


/**
 * 更新歌单封面
 * @param id 歌单 id
 * @param imgFile 图片文件对象
 * @param imgSize 图片尺寸, 默认为 300
 */
export function updatePlaylist(id: number | string, name: string, desc?: string) {
  return request.get('/playlist/update', {
    params: { id, name, desc }
  });
}

/**
 * 更新歌单封面
 * @param id 歌单 id
 * @param imgFile 图片文件对象
 * @param imgSize 图片尺寸, 默认为 300
 */
export function updatePlaylistCover(id: number | string, imgFile: File, imgSize: number = 300) {
  const formData = new FormData();
  formData.append('imgFile', imgFile);
  return request.post(`/playlist/cover/update?id=${id}&imgSize=${imgSize}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function getPersonalizePlaylists(limit?: number) {
  if (limit === undefined || limit > 30) limit = 15;
  return request.get('/personalized', { params: { limit } });
}

export function getPlaylsitDetail({ id, cookie }: { id: number | string, cookie?: string }) {
  return request.get('/playlist/detail', { params: { id, cookie: cookie } });
}

// 获取每日推荐歌单
export function getRecommendedPlaylists() {
  const cookie = localStorage.getItem('music_cookie') || '';
  return request.get('/recommend/resource', { params: { cookie } });
}

// 不喜欢某一首每日推荐
export function dislikeDailyRecommend(id: number | string) {
  const cookie = localStorage.getItem('music_cookie') || '';
  return request.get('/recommend/songs/dislike', { params: { id, cookie } });
}
