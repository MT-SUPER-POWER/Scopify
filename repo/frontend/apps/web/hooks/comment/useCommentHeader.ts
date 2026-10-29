"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommentResourceHeader } from "@/lib/comment/commentHeader";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { CommentResource } from "@/types/comment/api";

/** 评论页头部的资源信息；首次加载失败交给头部自己的边界，不影响下面的评论。 */
export function useCommentHeader(resource: CommentResource) {
  return useQuery({
    queryKey: musicQueryKeys.comment.header(resource.kind, resource.id),
    queryFn: () => getCommentResourceHeader(resource.kind, resource.id),
    staleTime: 5 * 60_000,
    throwOnError: throwQueryErrorWithoutData,
  });
}
