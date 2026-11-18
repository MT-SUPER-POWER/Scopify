"use client";

import Link from "next/link";
import { useMemo } from "react";
import { NowPlayingCard } from "./NowPlayingCard";
import { CommentPreviewList } from "@/components/Comment/CommentPreviewList";
import { useSongHotCommentsQuery } from "@/hooks/comment/useSongHotCommentsQuery";
import { useTranslation } from "react-i18next";

import { getCommentHref } from "@/lib/comment/commentResource";
import type { MusicProvider } from "@scopify/music-domain/identity";

/** 「精彩评论」：热评预览，标题旁可进入完整评论页。 */
export function NowPlayingHotComments({
  track,
}: {
  track: { provider: MusicProvider; id: string };
}) {
  const { t } = useTranslation();
  const target = useMemo(
    () => ({ provider: track.provider, kind: "track" as const, id: track.id }),
    [track.id, track.provider],
  );
  const query = useSongHotCommentsQuery(target);
  const comments = query.data?.comments ?? [];

  if (comments.length === 0) return null;

  return (
    <NowPlayingCard
      title={t("comments.page.hotComments")}
      className="pb-2"
      action={
        <Link
          href={getCommentHref("song", track.id)}
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
