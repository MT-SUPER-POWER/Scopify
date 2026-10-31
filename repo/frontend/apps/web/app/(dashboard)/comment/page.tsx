"use client";

import { MessageCircle } from "lucide-react";
import { CommentSection } from "@/components/Comment/CommentSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { useI18n } from "@/store/module/i18n";

export default function CommentPage() {
  const { t } = useI18n();
  const resource = useCommentResource();
  if (!resource)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-content-muted">
        <MessageCircle className="size-16 opacity-30" />
        <span>{t("comments.page.noComments")}</span>
      </div>
    );
  return (
    <QueryBoundary resetKey={`comment:thread:${resource.kind}:${resource.id}`} compact>
      <CommentSection resource={resource} />
    </QueryBoundary>
  );
}
