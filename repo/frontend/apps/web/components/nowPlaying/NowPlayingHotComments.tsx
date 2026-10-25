"use client";

import Image from "next/image";
import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { NowPlayingCard } from "./NowPlayingCard";
import { useSongHotCommentsQuery } from "@/hooks/comment/useSongHotCommentsQuery";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";

/** 「精彩评论」：网易云特色的热评预览，标题旁可进入完整评论页。 */
export function NowPlayingHotComments({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
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
          {t("nowPlaying.allComments", { count: (query.data?.total ?? 0).toLocaleString() })}
        </Link>
      }
    >
      <ul className="mt-2 flex flex-col">
        {comments.map((comment) => (
          <li key={comment.commentId} className="flex gap-3 px-4 py-2.5">
            <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-surface-elevated">
              {comment.user?.avatarUrl && (
                <Image
                  fill
                  sizes="28px"
                  src={getSizedImageUrl(comment.user.avatarUrl, 80)}
                  alt=""
                  className="object-cover"
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-content-muted">
                  {comment.user?.nickname}
                </span>
                {comment.likedCount > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-content-subtle tabular-nums">
                    <ThumbsUp className="size-3" />
                    {comment.likedCount.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-4 text-sm leading-6 break-words whitespace-pre-line text-content">
                {comment.content}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </NowPlayingCard>
  );
}
