"use client";

import Image from "next/image";
import Link from "next/link";
import { NowPlayingFollowButton } from "./NowPlayingFollowButton";
import { useArtistFollow } from "@/hooks/artist/useArtistFollow";
import { useArtistDetailQuery } from "@/hooks/artist/useArtistQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

/** 「关于艺人」：以主艺人大图开头、标题叠在图上，下方是粉丝数、关注按钮与简介摘要。 */
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
    <section className="overflow-hidden rounded-lg bg-surface-raised pb-4">
      <Link
        href={href}
        scroll={false}
        className="group relative block aspect-[4/3] overflow-hidden bg-surface-elevated"
      >
        {imageUrl ? (
          <Image
            fill
            sizes="480px"
            src={getSizedImageUrl(imageUrl, 640)}
            alt={artist?.name ?? ""}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          detailQuery.isLoading && <Skeleton className="size-full bg-skeleton" />
        )}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/55 to-transparent"
        />
        <h3 className="absolute top-4 left-4 text-sm font-bold text-white">
          {t("nowPlaying.aboutArtist")}
        </h3>
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
            <p className="mt-0.5 text-sm text-content-muted">
              {t("nowPlaying.fans", { count: follow.fansCount.toLocaleString() })}
            </p>
          )}
        </div>
        <NowPlayingFollowButton follow={follow} />
      </div>

      {artist?.briefDesc && (
        <p className="mt-3 line-clamp-3 px-4 text-sm leading-6 text-content-muted">
          {artist.briefDesc}
        </p>
      )}
    </section>
  );
}
