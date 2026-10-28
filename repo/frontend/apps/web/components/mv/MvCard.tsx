"use client";

import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, Link2, Play, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MvArtistAvatar } from "./MvArtistAvatar";
import { MvCardPreview } from "./MvCardPreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvArtistNames, getMvCover } from "@/lib/music/mvCover";
import { cn, formatDuration, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvCardProps } from "@/types/mv/components";

/** 悬停多久后开始播放预览，避免鼠标划过时到处起播。 */
const PREVIEW_DELAY_MS = 600;

/**
 * 网格用的 MV 卡片：12px 圆角 16:9 封面、左下角播放量、右下角时长，
 * 悬停片刻后静音预览；下方 36px 艺人头像、16px 两行标题、艺人名，悬停时右侧出现更多菜单。
 */
export function MvCard({ mv }: MvCardProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const [isHovering, setIsHovering] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cover = getMvCover(mv);
  const href = `/mv?id=${mv.id}`;
  const artistId = mv.artists?.[0]?.id ?? mv.artistId;
  const artistNames = getMvArtistNames(mv);
  const artistHref = artistId ? `/artist?id=${artistId}` : null;

  useEffect(() => {
    if (!isHovering) {
      setIsPreviewing(false);
      return;
    }
    const timer = window.setTimeout(() => setIsPreviewing(true), PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isHovering]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`);
      toast.success(t("mv.toast.linkCopied"));
    } catch {
      toast.error(t("common.message.requestFailed", { message: "" }));
    }
  };

  return (
    <div
      className={cn(
        "group/mv relative flex min-w-0 flex-col rounded-2xl p-3 transition-all duration-200",
        "bg-surface-elevated/40 hover:bg-surface-elevated hover:shadow-xl hover:shadow-black/20",
        isPreviewing && "bg-surface-elevated shadow-2xl shadow-black/30",
      )}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => setIsHovering(false)}
    >
      <Link
        href={href}
        scroll={false}
        className="relative block aspect-video w-full overflow-hidden rounded-xl bg-surface-sunken"
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
        {isPreviewing && <MvCardPreview mvid={mv.id} />}
        {mv.playCount && !isPreviewing ? (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-px text-xs leading-[18px] font-medium text-white tabular-nums">
            <Play className="size-3 fill-current" />
            {formatPlayCount(mv.playCount)}
          </span>
        ) : null}
        {mv.duration ? (
          <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-px text-xs leading-[18px] font-medium text-white tabular-nums">
            {formatDuration(mv.duration)}
          </span>
        ) : null}
      </Link>

      <div className="mt-3 flex min-w-0 gap-3">
        {artistHref ? (
          <Link href={artistHref} scroll={false} aria-label={artistNames} className="h-fit">
            <MvArtistAvatar artistId={artistId} name={artistNames} className="size-9" />
          </Link>
        ) : (
          <MvArtistAvatar artistId={artistId} name={artistNames} className="size-9" />
        )}

        <div className="min-w-0 flex-1 pr-6">
          <Link
            href={href}
            scroll={false}
            title={mv.name}
            className="line-clamp-2 text-base leading-[22px] font-medium text-content"
          >
            {mv.name}
          </Link>
          <div className="mt-1 text-sm leading-5 text-content-muted">
            {artistHref ? (
              <Link
                href={artistHref}
                scroll={false}
                title={artistNames}
                className="block truncate transition-colors hover:text-content"
              >
                {artistNames}
              </Link>
            ) : (
              <p className="truncate">{artistNames}</p>
            )}
          </div>
        </div>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("mv.card.more")}
              className={cn(
                "-mt-1 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-content transition-opacity hover:bg-content/10 focus-visible:opacity-100",
                isMenuOpen ? "opacity-100" : "opacity-0 group-hover/mv:opacity-100",
              )}
            >
              <EllipsisVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => void copyLink()} className="cursor-pointer">
              <Link2 className="mr-2 size-4" />
              {t("mv.action.copyLink")}
            </DropdownMenuItem>
            {artistHref && (
              <DropdownMenuItem
                onClick={() => void smartRouter.push(artistHref)}
                className="cursor-pointer"
              >
                <UserRound className="mr-2 size-4" />
                {t("mv.card.goToArtist")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
