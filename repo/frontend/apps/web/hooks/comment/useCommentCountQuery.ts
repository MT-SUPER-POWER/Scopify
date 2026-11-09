"use client";

import { useQuery } from "@tanstack/react-query";

import { useCommentKindSupported } from "@/hooks/comment/useCommentTarget";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { toCommentTarget } from "@/lib/comment/commentResource";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { CommentResourceKind } from "@/types/comment/model";

const COMMENT_COUNT_STALE_TIME_MS = 2 * 60 * 1000;

/** The comment total of a resource on the active platform; idle where it has no such thread. */
export function useCommentCountQuery(
  kind: CommentResourceKind | undefined,
  resourceId: null | string,
  enabled = true,
) {
  const provider = useActiveProvider();
  const supported = useCommentKindSupported(kind);
  return useQuery({
    enabled: enabled && supported && Boolean(resourceId),
    queryFn: ({ signal }) => {
      if (!kind || !resourceId) throw new Error("Comment resource is required");
      return provider.getCommentCount(
        toCommentTarget(provider.provider, { id: resourceId, kind }),
        signal,
      );
    },
    queryKey: musicQueryKeys.comment.count(provider.provider, kind ?? "unknown", resourceId ?? ""),
    staleTime: COMMENT_COUNT_STALE_TIME_MS,
  });
}
