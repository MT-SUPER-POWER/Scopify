"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { getCommentResourceHeader } from "@/lib/comment/commentHeader";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { CommentResource } from "@/types/comment/api";

/** 评论页头部的资源信息；首次加载时挂起，由头部 slot 的 loading.tsx 显示骨架，失败进头部自己的边界。 */
export function useCommentHeader(resource: CommentResource) {
  return useSuspenseQuery({
    queryKey: musicQueryKeys.comment.header(resource.kind, resource.id),
    queryFn: () => getCommentResourceHeader(resource.kind, resource.id),
    staleTime: 5 * 60_000,
  });
}
