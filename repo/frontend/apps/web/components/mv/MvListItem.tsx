"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvArtistNames, getMvCover } from "@/lib/music/mvCover";
import { cn, formatDuration, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvListItemProps } from "@/types/mv/components";

const ROW_CLASS =
  "group flex w-full items-start gap-2 rounded-lg p-1 text-left transition-colors hover:bg-content/5";

/** 横向 MV 条目：16:9 缩略图与时长、标题、艺人与播放量。传 href 时为链接，否则为按钮。 */
export function MvListItem({
  mv,
  href,
  onSelect,
  isActive = false,
  badge,
  size = "sm",
}: MvListItemProps) {
  const { t } = useI18n();
  const cover = getMvCover(mv);
  const artistNames = getMvArtistNames(mv);

  const content = (
    <>
      <span
        className={cn(
          "relative aspect-video shrink-0 overflow-hidden bg-surface-elevated",
          size === "md" ? "w-42 rounded-lg" : "w-28 rounded",
        )}
      >
        {cover && (
          <Image
            fill
            sizes={size === "md" ? "168px" : "112px"}
            src={getSizedImageUrl(cover, 240)}
            alt=""
            className={cn(
              "object-cover",
              size === "sm" && "transition-transform duration-300 group-hover:scale-105",
            )}
          />
        )}
        {size === "sm" && (
          <Play className="absolute inset-0 m-auto size-5 fill-white text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
        )}
        {mv.duration ? (
          <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[10px] leading-4 text-white tabular-nums">
            {formatDuration(mv.duration)}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "line-clamp-2 text-sm leading-5 font-medium",
            isActive ? "text-brand" : "text-content",
          )}
        >
          {mv.name}
        </span>
        {size === "md" ? (
          // YouTube 侧栏：艺人与观看次数分两行
          <span className="mt-1 block text-xs leading-[18px] text-content-muted">
            <span className="block truncate">{artistNames}</span>
            {mv.playCount ? (
              <span className="block truncate">
                {t("mv.meta.views", { count: formatPlayCount(mv.playCount) })}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-content-muted">
            {badge}
            <span className="truncate">
              {[artistNames, mv.playCount ? formatPlayCount(mv.playCount) : ""]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} scroll={false} aria-current={isActive || undefined} className={ROW_CLASS}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(mv.id)}
      aria-current={isActive || undefined}
      className={ROW_CLASS}
    >
      {content}
    </button>
  );
}
