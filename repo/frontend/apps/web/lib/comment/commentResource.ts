import type { InfiniteData } from "@tanstack/react-query";
import type {
  MusicComment,
  MusicCommentTarget,
  MusicCommentTargetKind,
} from "@scopify/music-domain/comment";
import type { MusicProvider } from "@scopify/music-domain/identity";

import {
  COMMENT_RESOURCE_KINDS,
  type CommentResource,
  type CommentResourceKind,
} from "@/types/comment/model";

export function getCommentHref(kind: CommentResourceKind, id: number | string) {
  if (kind === "song") return `/comment?songId=${id}`;
  return `/comment?resource=${kind}&id=${id}`;
}

function isCommentResourceKind(value: null | string): value is CommentResourceKind {
  return value !== null && (COMMENT_RESOURCE_KINDS as readonly string[]).includes(value);
}

export function resolveCommentResource(
  resource: null | string,
  id: null | string,
  legacySongId: null | string,
): CommentResource | null {
  if (legacySongId) return { id: legacySongId, kind: "song" };
  if (!id || !isCommentResourceKind(resource)) return null;
  return { id, kind: resource };
}

/** The kind of thread a page's resource kind names on the platform side ("song" is a track). */
export function commentTargetKindOf(kind: CommentResourceKind): MusicCommentTargetKind {
  return kind === "song" ? "track" : kind;
}

export function toCommentTarget(
  provider: MusicProvider,
  resource: CommentResource,
): MusicCommentTarget {
  return { provider, kind: commentTargetKindOf(resource.kind), id: resource.id };
}

/** 按评论 id 去重，保留先出现的那条：翻页时两页可能有重叠。 */
export function dedupeComments(comments: readonly MusicComment[]) {
  const seen = new Set<string>();
  return comments.filter((comment) => {
    if (seen.has(comment.id)) return false;
    seen.add(comment.id);
    return true;
  });
}

export function toggleCommentLiked(comment: MusicComment): MusicComment {
  const liked = !comment.liked;
  return { ...comment, liked, likeCount: Math.max(0, comment.likeCount + (liked ? 1 : -1)) };
}

/** 改写评论列表或楼中楼缓存（InfiniteData，每页带 comments）里的每一页。 */
export function mapCommentPages<TPage extends { comments: MusicComment[] }>(
  data: InfiniteData<TPage> | undefined,
  update: (comments: MusicComment[]) => MusicComment[],
): InfiniteData<TPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, comments: update(page.comments) })),
  };
}
