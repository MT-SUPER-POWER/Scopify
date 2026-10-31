"use client";

import Link from "next/link";
import { NowPlayingCard } from "./NowPlayingCard";
import { CommentPreviewList } from "@/components/Comment/CommentPreviewList";
import { useSongHotCommentsQuery } from "@/hooks/comment/useSongHotCommentsQuery";
import { useTranslation } from "react-i18next";

import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";

/** 「精彩评论」：网易云特色的热评预览，标题旁可进入完整评论页。 */
export function NowPlayingHotComments({ song }: NowPlayingSectionProps) {
  const { t } = useTranslation();
  const query = useSongHotCommentsQuery(song.id);
  const comments = query.data?.comments ?? [];

  if (comments.length === 0) return null;

  return (
    <NowPlayingCard
      title={t("comments.page.hotComments")}
      className="pb-2"
      action={
        <Link
          href={`/comment?songId=${song.id}`}
          scroll={false}
          className="shrink-0 text-xs font-bold text-content-muted transition-colors hover:text-content hover:underline"
        >
          {t("nowPlaying.allComments", {
            count: query.data?.total ?? 0,
            replace: { count: (query.data?.total ?? 0).toLocaleString() },
          })}
        </Link>
      }
    >
      <CommentPreviewList comments={comments} className="mt-2" />
    </NowPlayingCard>
  );
}
