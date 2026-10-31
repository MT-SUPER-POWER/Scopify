"use client";

import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { useI18n } from "@/store/module/i18n";
import { CommentHeaderSkeleton } from "./_components/CommentHeaderSkeleton";

export default function Loading() {
  const { t } = useI18n();
  const resource = useCommentResource();
  if (!resource) return null;
  return <CommentHeaderSkeleton tagLabel={t(`comments.page.${resource.kind}Tag`)} />;
}
