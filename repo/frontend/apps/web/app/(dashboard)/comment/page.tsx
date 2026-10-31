"use client";

import { CommentSection } from "@/components/Comment/CommentSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { CommentEmpty } from "./_components/CommentEmpty";

export default function CommentPage() {
  const resource = useCommentResource();
  if (!resource) return <CommentEmpty />;
  return (
    <QueryBoundary resetKey={`comment:thread:${resource.kind}:${resource.id}`} compact>
      <CommentSection resource={resource} />
    </QueryBoundary>
  );
}
