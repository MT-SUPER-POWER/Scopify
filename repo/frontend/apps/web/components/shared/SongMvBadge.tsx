"use client";

import Link from "next/link";
import { useI18n } from "@/store/module/i18n";
import type { SongMvBadgeProps } from "@/types/components/mv";

/** 歌名旁的「MV」小标签，点击进入 MV 页；不触发所在歌曲行的单击/双击播放。 */
export function SongMvBadge({ mvId }: SongMvBadgeProps) {
  const { t } = useI18n();
  if (!mvId) return null;

  return (
    <Link
      href={`/mv?id=${mvId}`}
      scroll={false}
      title={t("mv.action.watch")}
      aria-label={t("mv.action.watch")}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      className="inline-flex h-[13px] shrink-0 items-center rounded-xs border border-info bg-info/10 px-[2px] text-[9px] leading-[11px] font-normal text-info transition-colors hover:bg-info hover:text-white"
    >
      MV
    </Link>
  );
}
