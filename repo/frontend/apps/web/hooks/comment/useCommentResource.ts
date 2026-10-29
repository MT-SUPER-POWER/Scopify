"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { resolveCommentResource } from "@/lib/comment/commentResource";
import {
  COMMENT_RESOURCE_TYPE,
  type CommentResource,
  type CommentResourceRef,
} from "@/types/comment/api";

/** 评论所属资源：嵌入其他页面（如 MV 页）时直接传入，评论页从 URL 解析。 */
export function useCommentResource(resourceRef?: CommentResourceRef): CommentResource | null {
  const searchParams = useSearchParams();
  const refKind = resourceRef?.kind;
  const refId = resourceRef?.id;
  return useMemo(
    () =>
      refKind && refId
        ? { id: refId, kind: refKind, type: COMMENT_RESOURCE_TYPE[refKind] }
        : resolveCommentResource(
            searchParams.get("resource"),
            searchParams.get("id"),
            searchParams.get("SongId") || searchParams.get("songId"),
          ),
    [refId, refKind, searchParams],
  );
}
