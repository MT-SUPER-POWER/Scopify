"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvArtistNames, getMvCover } from "@/lib/music/mvCover";
import { formatDuration, formatPlayCount } from "@/lib/utils";
import type { MvCardProps } from "@/types/components/mv";

/** 网格用的 MV 卡片：16:9 封面带播放量与时长，下方标题与艺人，点击进入 MV 页。 */
export function MvCard({ mv }: MvCardProps) {
  const cover = getMvCover(mv);

  return (
    <Link
      href={`/mv?id=${mv.id}`}
      scroll={false}
      className="group flex min-w-0 flex-col gap-2 rounded-lg p-2 transition-colors hover:bg-surface-elevated"
    >
      <span className="relative aspect-video w-full overflow-hidden rounded-md bg-surface-elevated shadow-sm">
        {cover && (
          <Image
            fill
            sizes="(min-width: 1280px) 25vw, 50vw"
            src={getSizedImageUrl(cover, 480)}
            alt=""
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/60 to-transparent"
        />
        {mv.playCount ? (
          <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-xs text-white tabular-nums">
            <Play className="size-3 fill-current" />
            {formatPlayCount(mv.playCount)}
          </span>
        ) : null}
        {mv.duration ? (
          <span className="absolute right-2 bottom-1.5 text-xs text-white tabular-nums">
            {formatDuration(mv.duration)}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 px-0.5">
        <span className="line-clamp-2 text-sm leading-5 font-medium text-content">{mv.name}</span>
        <span className="mt-0.5 block truncate text-xs text-content-muted">
          {getMvArtistNames(mv)}
        </span>
      </span>
    </Link>
  );
}
