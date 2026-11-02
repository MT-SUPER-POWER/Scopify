"use client";

import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { useTranslation } from "react-i18next";

import { CommentHeaderSkeleton } from "./_components/CommentHeaderSkeleton";

export default function Loading() {
  const { t } = useTranslation();
  const resource = useCommentResource();
  if (!resource) return null;
  return <CommentHeaderSkeleton tagLabel={t(`comments.page.${resource.kind}Tag`)} />;
}
