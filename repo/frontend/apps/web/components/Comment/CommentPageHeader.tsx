"use client";

import { CommentHeader } from "@/components/Comment/CommentHeader";
import { CommentHeaderSkeleton } from "@/components/Comment/CommentPageSkeleton";
import { useCommentHeader } from "@/hooks/comment/useCommentHeader";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { CommentPageHeaderProps } from "@/types/comment/components";

/**
 * 评论页头部：资源封面、标题与歌手，以及铺在页面顶部的封面模糊背景。
 * 自己请求资源信息，调用方需要在外面套一层 QueryBoundary：取不到时只有头部失败，评论照常显示。
 */
export function CommentPageHeader({ resource }: CommentPageHeaderProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const header = useCommentHeader(resource);
  const tagLabel = t(`comments.page.${resource.kind}Tag`);

  if (!header.data) return <CommentHeaderSkeleton tagLabel={tagLabel} />;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 scale-110 bg-cover bg-center opacity-60 blur-3xl md:h-125"
        style={{
          backgroundImage: `linear-gradient(to bottom, var(--scopify-image-scrim), var(--card)), url(${header.data.coverUrl})`,
        }}
      />
      <CommentHeader
        coverUrl={header.data.coverUrl}
        title={header.data.title}
        albumName={header.data.albumName}
        artists={header.data.artists}
        tagLabel={tagLabel}
        onArtistClick={(artistId) => smartRouter.push(`/artist?id=${artistId}`)}
      />
    </>
  );
}
