"use client";

import { MessageCircle } from "lucide-react";
import { CommentHeader } from "@/components/Comment/CommentHeader";
import { CommentHeaderSkeleton } from "@/components/Comment/CommentPageSkeleton";
import { CommentSection } from "@/components/Comment/CommentSection";
import { useCommentData } from "@/hooks/comment/useCommentData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

export default function CommentPage() {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const data = useCommentData();
  const { albumCover, commentHeaderInfo, isHeaderLoading, resourceId } = data;

  if (!resourceId) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-surface-raised p-8 text-content-muted">
        <MessageCircle className="size-16 opacity-30" />
        <span>{t("comments.page.noComments")}</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-surface-raised pb-12 font-sans text-content">
      {!isHeaderLoading && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 scale-110 bg-cover bg-center opacity-60 blur-3xl md:h-125"
          style={{
            backgroundImage: `linear-gradient(to bottom, var(--scopify-image-scrim), var(--card)), url(${albumCover})`,
          }}
        />
      )}

      {isHeaderLoading ? (
        <CommentHeaderSkeleton tagLabel={commentHeaderInfo.tagLabel} />
      ) : (
        <CommentHeader
          coverUrl={albumCover}
          title={commentHeaderInfo.title}
          albumName={commentHeaderInfo.albumName}
          artists={commentHeaderInfo.artists}
          total={commentHeaderInfo.total}
          tagLabel={commentHeaderInfo.tagLabel}
          onArtistClick={(artistId) => smartRouter.push(`/artist?id=${artistId}`)}
        />
      )}

      <div className="hero-content-transition relative z-10 px-6 pt-6 md:px-8 md:pt-8 lg:px-10 xl:px-12">
        <div className="max-w-4xl">
          <CommentSection data={data} />
        </div>
      </div>
    </div>
  );
}
