"use client";

import Image from "next/image";
import Link from "next/link";
import { MvArtistAvatar } from "./MvArtistAvatar";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvArtistNames, getMvCover } from "@/lib/music/mvCover";
import { formatDuration, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvCardProps } from "@/types/components/mv";

/**
 * 网格用的 MV 卡片（参考 YouTube）：大圆角 16:9 封面带时长，
 * 下方艺人头像 + 两行标题 + 艺人名与播放量。封面与标题进入 MV 页，头像与艺人名进入歌手页。
 */
export function MvCard({ mv }: MvCardProps) {
  const { t } = useI18n();
  const cover = getMvCover(mv);
  const href = `/mv?id=${mv.id}`;
  const artistId = mv.artists?.[0]?.id ?? mv.artistId;
  const artistNames = getMvArtistNames(mv);
  const artistHref = artistId ? `/artist?id=${artistId}` : null;

  return (
    <div className="group flex min-w-0 flex-col gap-3">
      <Link
        href={href}
        scroll={false}
        className="relative block aspect-video w-full overflow-hidden rounded-xl bg-surface-elevated transition-[border-radius] duration-200 group-hover:rounded-md"
      >
        {cover && (
          <Image
            fill
            sizes="(min-width: 1280px) 25vw, 50vw"
            src={getSizedImageUrl(cover, 640)}
            alt={mv.name}
            className="object-cover"
          />
        )}
        {mv.duration ? (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1 py-px text-xs font-medium text-white tabular-nums">
            {formatDuration(mv.duration)}
          </span>
        ) : null}
      </Link>

      <div className="flex min-w-0 gap-3 pr-2">
        {artistHref ? (
          <Link href={artistHref} scroll={false} aria-label={artistNames} className="h-fit">
            <MvArtistAvatar artistId={artistId} name={artistNames} className="size-9" />
          </Link>
        ) : (
          <MvArtistAvatar artistId={artistId} name={artistNames} className="size-9" />
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            scroll={false}
            title={mv.name}
            className="line-clamp-2 text-[15px] leading-snug font-semibold text-content"
          >
            {mv.name}
          </Link>
          {artistHref ? (
            <Link
              href={artistHref}
              scroll={false}
              className="mt-1 block truncate text-sm text-content-muted transition-colors hover:text-content"
            >
              {artistNames}
            </Link>
          ) : (
            <p className="mt-1 truncate text-sm text-content-muted">{artistNames}</p>
          )}
          {mv.playCount ? (
            <p className="truncate text-sm text-content-muted">
              {t("mv.meta.plays", { count: formatPlayCount(mv.playCount) })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
