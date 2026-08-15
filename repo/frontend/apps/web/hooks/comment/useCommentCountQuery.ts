"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getMusicComments,
  getNewComments,
  getPlaylistComments,
  getVoiceComments,
} from "@/lib/api/comment";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { COMMENT_RESOURCE_TYPE, type CommentResourceKind } from "@/types/api/comment";

const COMMENT_COUNT_STALE_TIME_MS = 2 * 60 * 1000;

async function fetchCommentCount(kind: CommentResourceKind, resourceId: string) {
  if (kind === "voice-list") {
    const response = await getNewComments({
      id: resourceId,
      pageNo: 1,
      pageSize: 1,
      sortType: 3,
      type: COMMENT_RESOURCE_TYPE[kind],
    });
    const total = response.data?.data?.totalCount;
    if (typeof total === "number" && total >= 0) return total;
  } else {
    const params = { id: resourceId, limit: 1, offset: 0 };
    const response = await (kind === "playlist"
      ? getPlaylistComments(params)
      : kind === "voice"
        ? getVoiceComments(params)
        : getMusicComments(params));
    const total = response.data?.total;
    if (typeof total === "number" && total >= 0) return total;
  }

  throw new Error("Comment response did not include a usable total");
}

export function useCommentCountQuery(
  kind: CommentResourceKind | undefined,
  resourceId: null | string,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && kind !== undefined && Boolean(resourceId),
    queryFn: () => {
      if (!kind || !resourceId) throw new Error("Comment resource is required");
      return fetchCommentCount(kind, resourceId);
    },
    queryKey: musicQueryKeys.comment.count(kind ?? "unknown", resourceId ?? ""),
    staleTime: COMMENT_COUNT_STALE_TIME_MS,
  });
}
