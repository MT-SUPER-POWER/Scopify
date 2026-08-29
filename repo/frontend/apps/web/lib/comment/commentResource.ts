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

export function resolveCommentIpLocation(
  comment:
    | {
        ipLocation?: { ip?: string; location?: string } | string | null;
        location?: string | null;
      }
    | undefined,
): string | undefined {
  if (!comment) return undefined;
  const raw = comment.ipLocation ?? comment.location;
  if (!raw) return undefined;

  let loc = "";
  if (typeof raw === "string") {
    loc = raw;
  } else if (typeof raw === "object") {
    loc = raw.location ?? raw.ip ?? "";
  }

  const cleaned = loc
    .trim()
    .replace(/^IP属地[：:]\s*/i, "")
    .replace(/^IP[：:]\s*/i, "");
  return cleaned.length > 0 ? cleaned : undefined;
}
