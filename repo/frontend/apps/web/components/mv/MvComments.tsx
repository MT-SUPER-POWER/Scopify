"use client";

import { useMemo } from "react";
import { CommentSection } from "@/components/Comment/CommentSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { COMMENT_RESOURCE_TYPE } from "@/types/comment/api";
import type { MvCommentsProps } from "@/types/mv/components";

/** MV 页视频下方的评论区：布局与评论页共用 CommentSection，评论取不到时只有这一栏失败。 */
export function MvComments({ mvid }: MvCommentsProps) {
  const resource = useMemo(
    () => ({ id: String(mvid), kind: "mv" as const, type: COMMENT_RESOURCE_TYPE.mv }),
    [mvid],
  );

  return (
    <div className="mt-6">
      <QueryBoundary resetKey={`mv:comments:${mvid}`} compact>
        <CommentSection resource={resource} />
      </QueryBoundary>
    </div>
  );
}
