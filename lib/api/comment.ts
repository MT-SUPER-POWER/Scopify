import request from "../web/request";

export interface MusicCommentParams {
  id: number | string;
  limit?: number;
  offset?: number;
  before?: number;
}

export async function getMusicComments(params: MusicCommentParams) {
  const cookie = localStorage.getItem("music_cookie") || "";
  return request.get("/comment/music", {
    params: {
      id: params.id,
      limit: params.limit,
      offset: params.offset,
      before: params.before,
      cookie: cookie,
    },
  });
}

/**
 *
 * @param id
 * @param content
 */
export function addMusicComments(id: string | number, content: string) {
  return request.get("/comment/add", {
    params: { id: id, content: content },
  });
}

/**
 *
 * @param id 歌曲id
 * @param t 0 删除 1 发送, 2 回复
 * @param type 资源类型 0歌曲 1mv 2专辑 3歌单 4电台 5视频
 * @param commentId 被操作的评论id
 */
export function delComments(songId: string | number, commentId: string | number) {
  return request.get("/comment", {
    params: { id: songId, t: 0, type: 0, commentId: commentId },
  });
}

/**
 * @param id 歌曲id
 * @param t 0 删除 1 发送, 2 回复
 * @param commentId 被操作的评论id
 * @param content 回复内容
 */
export function replyComments(
  songId: string | number,
  commentId: string | number,
  content: string,
) {
  return request.get("/comment", {
    params: {
      id: songId,
      t: 2,
      type: 0,
      commentId: commentId,
      content: content,
    },
  });
}

/**
 * 评论点赞/取消点赞
 * @param id 资源id
 * @param cid 评论id
 * @param t 是否点赞 1点赞 0取消
 * @param type 资源类型 0歌曲 1mv 2专辑 3歌单 4电台 5视频
 */
export function toggleLikeComments(
  id: string | number,
  cid: string | number,
  t: 1 | 0,
  type: number,
) {
  const cookie = localStorage.getItem("music_cookie") || "";
  return request.get("/comment/like", {
    params: { id, cid, t, type, cookie },
  });
}
