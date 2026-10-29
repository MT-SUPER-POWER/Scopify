"use client";

import { useMemo } from "react";
import { CommentSection } from "@/components/Comment/CommentSection";
import { useCommentData } from "@/hooks/comment/useCommentData";
import type { MvCommentsProps } from "@/types/mv/components";

/** MV 页视频下方的评论区：数据取自 useCommentData，布局与评论页共用 CommentSection。 */
export function MvComments({ mvid }: MvCommentsProps) {
  const resource = useMemo(() => ({ kind: "mv" as const, id: String(mvid) }), [mvid]);
  const data = useCommentData(resource);

  return (
    <div className="mt-6">
      <CommentSection data={data} />
    </div>
  );
}
