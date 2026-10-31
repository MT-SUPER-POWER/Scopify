"use client";

import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { CommentPageHeader } from "./_components/CommentPageHeader";

/** 头部与评论各自一个边界：资源信息取不到不影响评论，反之亦然。 */
export default function CommentHeaderSlot() {
  const resource = useCommentResource();
  if (!resource) return null;
  return (
    <QueryBoundary resetKey={`comment:header:${resource.kind}:${resource.id}`} compact>
      <CommentPageHeader resource={resource} />
    </QueryBoundary>
  );
}
