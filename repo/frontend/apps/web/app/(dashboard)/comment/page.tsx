"use client";

import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { CommentSection } from "@/components/Comment/CommentSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { useCommentKindSupported } from "@/hooks/comment/useCommentTarget";
import { useTranslation } from "react-i18next";

export default function CommentPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const resource = useCommentResource();
  const supported = useCommentKindSupported(resource?.kind);
  const focusCommentId = searchParams.get("commentId");
  const focusParentCommentId = searchParams.get("parentCommentId");
  if (!resource || !supported)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-content-muted">
        <MessageCircle className="size-16 opacity-30" />
        <span>{t("comments.page.noComments")}</span>
      </div>
    );
  return (
    <QueryBoundary resetKey={`comment:thread:${resource.kind}:${resource.id}`} compact>
      <CommentSection
        resource={resource}
        focusCommentId={focusCommentId}
        focusParentCommentId={focusParentCommentId}
      />
    </QueryBoundary>
  );
}
