"use client";

import Image from "next/image";
import Link from "next/link";
import { NowPlayingCard } from "./NowPlayingCard";
import { useArtistFollow } from "@/hooks/artist/useArtistFollow";
import { useArtistDetailQuery } from "@/hooks/artist/useArtistQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

/** 「关于艺人」：主艺人的封面、粉丝数、简介摘要与关注按钮。 */
export function NowPlayingArtistCard({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const artistId = song.ar?.[0]?.id;
  const detailQuery = useArtistDetailQuery(artistId ? String(artistId) : null);
  const follow = useArtistFollow(artistId ?? "");

  // 声音、本地或云盘歌曲可能没有有效的艺人 id
  if (!artistId) return null;

  const artist = detailQuery.data?.data?.artist;
  const imageUrl = artist?.cover || artist?.avatar;
  const href = `/artist?id=${artistId}`;

  return (
    <NowPlayingCard title={t("nowPlaying.aboutArtist")} className="pb-4">
      <Link
        href={href}
        scroll={false}
        className="relative mx-4 mt-3 block aspect-[4/3] overflow-hidden rounded-md bg-surface-elevated"
      >
        {imageUrl ? (
          <Image
            fill
            sizes="480px"
            src={getSizedImageUrl(imageUrl, 640)}
            alt={artist?.name ?? ""}
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          detailQuery.isLoading && <Skeleton className="size-full bg-skeleton" />
        )}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <Link
            href={href}
            scroll={false}
            className="block truncate text-base font-bold text-content hover:underline"
          >
            {artist?.name ?? song.ar[0].name}
          </Link>
          {follow.fansCount !== undefined && (
            <p className="mt-0.5 text-xs text-content-muted">
              {t("nowPlaying.fans", { count: follow.fansCount.toLocaleString() })}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={follow.isFollowStatusLoading}
          onClick={() => void follow.toggleFollow()}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50",
            follow.isFollowing
              ? "border-content/30 text-content hover:border-content"
              : "border-content-muted text-content hover:border-content",
          )}
        >
          {follow.isFollowing ? t("artist.action.following") : t("artist.action.follow")}
        </button>
      </div>

      {artist?.briefDesc && (
        <p className="mt-3 line-clamp-4 px-4 text-sm leading-6 text-content-muted">
          {artist.briefDesc}
        </p>
      )}
    </NowPlayingCard>
  );
}
