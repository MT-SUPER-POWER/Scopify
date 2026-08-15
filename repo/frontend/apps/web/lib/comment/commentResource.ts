import {
  COMMENT_RESOURCE_TYPE,
  type CommentResourceKind,
  type NewCommentResponse,
} from "@/types/api/comment";
import type { SongComment } from "@/types/api/music";

export function getCommentHref(kind: CommentResourceKind, id: number | string) {
  if (kind === "song") return `/comment?songId=${id}`;
  return `/comment?resource=${kind}&id=${id}`;
}

export function resolveCommentResource(
  resource: null | string,
  id: null | string,
  legacySongId: null | string,
) {
  if (legacySongId) {
    return { id: legacySongId, kind: "song", type: COMMENT_RESOURCE_TYPE.song } as const;
  }

  if (!id || !isCommentResourceKind(resource)) return null;
  return { id, kind: resource, type: COMMENT_RESOURCE_TYPE[resource] };
}

export function normalizeLegacyComments(data: SongComment | undefined) {
  return {
    comments: data?.comments ?? [],
    cursor: undefined,
    hasMore: data?.more ?? false,
    hotComments: data?.hotComments ?? [],
    total: data?.total ?? 0,
  };
}

export function normalizeNewComments(data: NewCommentResponse | undefined) {
  return {
    comments: data?.data?.comments ?? [],
    cursor: data?.data?.cursor,
    hasMore: data?.data?.hasMore ?? false,
    hotComments: [],
    total: data?.data?.totalCount ?? 0,
  };
}

function isCommentResourceKind(value: null | string): value is CommentResourceKind {
  return value !== null && value in COMMENT_RESOURCE_TYPE;
}
