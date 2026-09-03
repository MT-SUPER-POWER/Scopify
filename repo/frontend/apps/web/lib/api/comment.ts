import type {
  CommentResourceType,
  MusicCommentParams,
  NewCommentParams,
  NewCommentResponse,
} from "@/types/api/comment";
import type { SongComment } from "@/types/api/music";
import request, { requestConfig } from "../web/request";

export async function getMusicComments(params: MusicCommentParams) {
  return request.get<SongComment>("/comment/music", {
    params: {
      id: params.id,
      limit: params.limit,
      offset: params.offset,
      before: params.before,
    },
  });
}

export function getPlaylistComments(params: MusicCommentParams) {
  return request.get<SongComment>("/comment/playlist", { params });
}

export function getAlbumComments(params: MusicCommentParams) {
  return request.get<SongComment>("/comment/album", { params });
}

export function getVoiceComments(params: MusicCommentParams) {
  return request.get<SongComment>("/comment/dj", { params });
}

export function getNewComments(params: NewCommentParams) {
  return request.get<NewCommentResponse>("/comment/new", { params });
}

/**
 *
 * @param id
 * @param content
 */
export function addMusicComments(id: string | number, content: string) {
  return addResourceComment(id, content, 0);
}

export function addResourceComment(
  id: string | number,
  content: string,
  type: CommentResourceType,
) {
  return request.get(
    "/comment/add",
    requestConfig({ params: { id, content, type }, requiresMusicSession: true }),
  );
}

/**
 *
 * @param id 歌曲id
 * @param t 0 删除 1 发送, 2 回复
 * @param type 资源类型 0歌曲 2歌单 3专辑 4电台节目 7电台/VoiceList
 * @param commentId 被操作的评论id
 */
export function delComments(
  resourceId: string | number,
  commentId: string | number,
  type: CommentResourceType = 0,
) {
  return request.get(
    "/comment",
    requestConfig({
      params: { id: resourceId, t: 0, type, commentId },
      requiresMusicSession: true,
    }),
  );
}

/**
 * @param id 歌曲id
 * @param t 0 删除 1 发送, 2 回复
 * @param commentId 被操作的评论id
 * @param content 回复内容
 */
export function replyComments(
  resourceId: string | number,
  commentId: string | number,
  content: string,
  type: CommentResourceType = 0,
) {
  return request.get(
    "/comment",
    requestConfig({
      params: { id: resourceId, t: 2, type, commentId, content },
      requiresMusicSession: true,
    }),
  );
}

/**
 * 评论点赞/取消点赞
 * @param id 资源id
 * @param cid 评论id
 * @param t 是否点赞 1点赞 0取消
 * @param type 资源类型 0歌曲 2歌单 3专辑 4电台节目 7电台/VoiceList
 */
export function toggleLikeComments(
  id: string | number,
  cid: string | number,
  t: 1 | 0,
  type: CommentResourceType,
) {
  return request.get(
    "/comment/like",
    requestConfig({ params: { id, cid, t, type }, requiresMusicSession: true }),
  );
}
