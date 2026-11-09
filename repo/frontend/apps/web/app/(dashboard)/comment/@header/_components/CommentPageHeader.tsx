"use client";

import { CommentHeader } from "./CommentHeader";
import { useCommentHeader } from "@/hooks/comment/useCommentHeader";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useTranslation } from "react-i18next";

import type { CommentPageHeaderProps } from "@/types/comment/components";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

/**
 * 评论页头部：资源封面、标题与歌手，以及铺在页面顶部的封面模糊背景。
 * 自己请求资源信息：首次加载由 slot 的 loading.tsx 显示骨架，调用方需要在外面套一层
 * QueryBoundary：取不到时只有头部失败，评论照常显示。
 */
export function CommentPageHeader({ resource }: CommentPageHeaderProps) {
  const { t } = useTranslation();
  const smartRouter = useSmartRouter();
  const header = useCommentHeader(resource);
  const tagLabel = t(`comments.page.${resource.kind}Tag`);
  const coverUrl = header.data.coverUrl ?? FALLBACK_COVER;
  const artists = header.data.artists.map((artist) => ({
    ...artist,
    avatarUrl: artist.avatarUrl ?? undefined,
  }));

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 scale-110 bg-cover bg-center opacity-60 blur-3xl md:h-125"
        style={{
          backgroundImage: `linear-gradient(to bottom, var(--scopify-image-scrim), var(--card)), url(${coverUrl})`,
        }}
      />
      <CommentHeader
        coverUrl={coverUrl}
        title={header.data.title}
        albumName={header.data.subtitle ?? undefined}
        artists={artists}
        tagLabel={tagLabel}
        onArtistClick={(artistId) => smartRouter.push(`/artist?id=${artistId}`)}
      />
    </>
  );
}
