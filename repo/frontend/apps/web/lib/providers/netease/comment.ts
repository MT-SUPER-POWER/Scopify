import type {
  MusicCommentSource,
  MusicCommentTarget,
  MusicCommentTargetKind,
} from "@scopify/music-domain/comment";

import {
  adaptNeteaseComment,
  adaptNeteaseCommentHeader,
  adaptNeteaseFloorComments,
  adaptNeteaseNewComments,
} from "@/lib/providers/netease/adapters/comment";
import {
  addResourceComment,
  delComments,
  getAlbumComments,
  getFloorComments,
  getMusicComments,
  getMVComments,
  getNewComments,
  getPlaylistComments,
  getVoiceComments,
  replyComments,
  toggleLikeComments,
} from "@/lib/providers/netease/api/comment";
import { getCommentResourceHeader } from "@/lib/providers/netease/commentHeader";
import { NETEASE_COMMENT_TYPE } from "@/types/providers/netease/commentApi";

/** /comment/new's sortType: 1 is by popularity, 3 by time. */
const SORT_TYPE = { hot: 1, latest: 3 } as const;

const NETEASE_COMMENT_TARGET_KINDS: ReadonlySet<MusicCommentTargetKind> = new Set([
  "track",
  "album",
  "playlist",
  "mv",
  "voice",
  "voice-list",
]);

/** The older per-kind endpoints, which carry the hot comments and a total. */
function getLegacyComments(
  target: MusicCommentTarget,
  params: { limit: number; offset: number },
  signal?: AbortSignal,
) {
  const query = { id: target.id, ...params };
  switch (target.kind) {
    case "album":
      return getAlbumComments(query);
    case "playlist":
      return getPlaylistComments(query);
    case "voice":
      return getVoiceComments(query);
    case "mv":
      return getMVComments(query, signal);
    default:
      return getMusicComments(query);
  }
}

export const neteaseCommentSource: MusicCommentSource = {
  commentTargetKinds: NETEASE_COMMENT_TARGET_KINDS,

  async getComments(target, request) {
    const response = await getNewComments({
      cursor: request.cursor,
      id: target.id,
      pageNo: request.pageNo,
      pageSize: request.pageSize,
      sortType: SORT_TYPE[request.sort],
      type: NETEASE_COMMENT_TYPE[target.kind],
    });
    return adaptNeteaseNewComments(response.data);
  },

  async getCommentCount(target, signal) {
    if (target.kind === "voice-list") {
      const response = await getNewComments({
        id: target.id,
        pageNo: 1,
        pageSize: 1,
        sortType: 3,
        type: NETEASE_COMMENT_TYPE[target.kind],
      });
      const total = response.data?.data?.totalCount;
      if (typeof total === "number" && total >= 0) return total;
    } else {
      const response = await getLegacyComments(target, { limit: 1, offset: 0 }, signal);
      const total = response.data?.total;
      if (typeof total === "number" && total >= 0) return total;
    }
    throw new Error("Comment response did not include a usable total");
  },

  async getHotComments(target, limit, signal) {
    const response = await getLegacyComments(target, { limit, offset: 0 }, signal);
    const hot = response.data?.hotComments ?? [];
    return {
      comments: (hot.length > 0 ? hot : (response.data?.comments ?? []))
        .slice(0, limit)
        .map(adaptNeteaseComment),
      total: response.data?.total ?? 0,
    };
  },

  async getCommentTargetHeader(target) {
    return adaptNeteaseCommentHeader(await getCommentResourceHeader(target.kind, target.id));
  },

  async getCommentReplies(target, commentId, request) {
    const response = await getFloorComments({
      id: target.id,
      limit: request.pageSize,
      parentCommentId: commentId,
      time: request.cursor === undefined ? undefined : Number(request.cursor),
      type: NETEASE_COMMENT_TYPE[target.kind],
    });
    return adaptNeteaseFloorComments(response.data);
  },

  async addComment(target, content) {
    await addResourceComment(target.id, content, NETEASE_COMMENT_TYPE[target.kind]);
  },

  async replyToComment(target, commentId, content) {
    await replyComments(target.id, commentId, content, NETEASE_COMMENT_TYPE[target.kind]);
  },

  async deleteComment(target, commentId) {
    await delComments(target.id, commentId, NETEASE_COMMENT_TYPE[target.kind]);
  },

  async setCommentLiked(target, commentId, liked) {
    await toggleLikeComments(
      target.id,
      commentId,
      liked ? 1 : 0,
      NETEASE_COMMENT_TYPE[target.kind],
    );
  },
};
