"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingFollowButtonProps } from "@/types/player/nowPlayingComponents";

/** 面板内统一的描边胶囊关注按钮。 */
export function NowPlayingFollowButton({ follow, className }: NowPlayingFollowButtonProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      disabled={follow.isFollowStatusLoading}
      onClick={() => void follow.toggleFollow()}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1 text-xs font-bold text-content transition-all hover:scale-105 disabled:opacity-50",
        follow.isFollowing
          ? "border-content/30 hover:border-content"
          : "border-content-muted hover:border-content",
        className,
      )}
    >
      {follow.isFollowing ? t("artist.action.following") : t("artist.action.follow")}
    </button>
  );
}
