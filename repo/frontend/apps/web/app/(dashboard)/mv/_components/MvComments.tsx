"use client";

import { useMemo } from "react";
import { CommentSection } from "@/components/Comment/CommentSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useCommentKindSupported } from "@/hooks/comment/useCommentTarget";
import type { MvCommentsProps } from "@/types/mv/components";

/**
 * MV 页视频下方的评论区：布局与评论页共用 CommentSection，评论取不到时只有这一栏失败。
 * 平台没有 MV 评论（QQ）时不显示这一栏。
 */
export function MvComments({ mvid }: MvCommentsProps) {
  const supported = useCommentKindSupported("mv");
  const resource = useMemo(() => ({ id: mvid, kind: "mv" as const }), [mvid]);
  if (!supported) return null;

  return (
    <div className="mt-6">
      <QueryBoundary resetKey={`mv:comments:${mvid}`} compact>
        <CommentSection resource={resource} />
      </QueryBoundary>
    </div>
  );
}
