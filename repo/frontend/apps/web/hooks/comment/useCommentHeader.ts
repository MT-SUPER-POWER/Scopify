"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useCommentTarget } from "@/hooks/comment/useCommentTarget";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { CommentResource } from "@/types/comment/model";

/** 评论页头部的资源信息；首次加载时挂起，由头部 slot 的 loading.tsx 显示骨架，失败进头部自己的边界。 */
export function useCommentHeader(resource: CommentResource) {
  const provider = useActiveProvider();
  const target = useCommentTarget(resource);
  return useSuspenseQuery({
    queryKey: musicQueryKeys.comment.header(provider.provider, resource.kind, resource.id),
    queryFn: ({ signal }) => provider.getCommentTargetHeader(target, signal),
    staleTime: 5 * 60_000,
  });
}
