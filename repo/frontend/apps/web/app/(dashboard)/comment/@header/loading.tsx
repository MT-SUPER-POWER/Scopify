"use client";

import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { useCommentKindSupported } from "@/hooks/comment/useCommentTarget";
import { useTranslation } from "react-i18next";

import { CommentHeaderSkeleton } from "./_components/CommentHeaderSkeleton";

export default function Loading() {
  const { t } = useTranslation();
  const resource = useCommentResource();
  const supported = useCommentKindSupported(resource?.kind);
  if (!resource || !supported) return null;
  return <CommentHeaderSkeleton tagLabel={t(`comments.page.${resource.kind}Tag`)} />;
}
