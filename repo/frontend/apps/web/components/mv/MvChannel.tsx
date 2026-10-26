"use client";

import Link from "next/link";
import { MvArtistAvatar } from "./MvArtistAvatar";
import { useArtistFollow } from "@/hooks/artist/useArtistFollow";
import { cn, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvChannelProps } from "@/types/components/mv";

/** MV 页标题下的艺人行（参考 YouTube 频道行）：头像、名字、粉丝数与关注按钮。 */
export function MvChannel({ artist }: MvChannelProps) {
  const { t } = useI18n();
  const follow = useArtistFollow(artist.id);
  const href = `/artist?id=${artist.id}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link href={href} scroll={false} aria-label={artist.name}>
        <MvArtistAvatar artistId={artist.id} name={artist.name} className="size-10" />
      </Link>
      <div className="min-w-0">
        <Link
          href={href}
          scroll={false}
          className="block truncate text-base font-bold text-content hover:underline"
        >
          {artist.name}
        </Link>
        {follow.fansCount !== undefined && (
          <p className="truncate text-xs text-content-muted">
            {t("mv.channel.fans", { count: formatPlayCount(follow.fansCount) })}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={follow.isFollowStatusLoading}
        onClick={() => void follow.toggleFollow()}
        className={cn(
          "ml-2 h-9 shrink-0 rounded-full px-4 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50",
          follow.isFollowing
            ? "bg-content/8 text-content hover:bg-content/15"
            : "bg-content text-surface hover:bg-content/85",
        )}
      >
        {follow.isFollowing ? t("artist.action.following") : t("artist.action.follow")}
      </button>
    </div>
  );
}
