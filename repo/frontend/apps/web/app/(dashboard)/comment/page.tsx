"use client";

import { MessageCircle } from "lucide-react";
import { CommentPageHeader } from "@/components/Comment/CommentPageHeader";
import { CommentSection } from "@/components/Comment/CommentSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useCommentResource } from "@/hooks/comment/useCommentResource";
import { useI18n } from "@/store/module/i18n";

export default function CommentPage() {
  const { t } = useI18n();
  const resource = useCommentResource();

  if (!resource) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-surface-raised p-8 text-content-muted">
        <MessageCircle className="size-16 opacity-30" />
        <span>{t("comments.page.noComments")}</span>
      </div>
    );
  }

  const resourceKey = `${resource.kind}:${resource.id}`;

  return (
    <div className="relative min-h-screen w-full bg-surface-raised pb-12 font-sans text-content">
      {/* 头部与评论各自一个边界：资源信息取不到不影响评论，反之亦然 */}
      <QueryBoundary resetKey={`comment:header:${resourceKey}`} compact>
        <CommentPageHeader resource={resource} />
      </QueryBoundary>

      <div className="hero-content-transition relative z-10 px-6 pt-6 md:px-8 md:pt-8 lg:px-10 xl:px-12">
        <div className="max-w-4xl">
          <QueryBoundary resetKey={`comment:thread:${resourceKey}`} compact>
            <CommentSection resource={resource} />
          </QueryBoundary>
        </div>
      </div>
    </div>
  );
}
