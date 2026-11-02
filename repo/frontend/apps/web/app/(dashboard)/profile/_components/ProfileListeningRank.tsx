"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUserListeningRank } from "@/hooks/profile/useUserListeningRank";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "@/store/module/player";
import { SocialState } from "@/components/social/SocialPrimitives";
import type { ProfileListeningRankProps } from "@/types/social/components";
import type { ListeningRankPeriod } from "@/types/user/profile";
import { cn } from "@/lib/utils";
import {
  profileRankCoverClass,
  profileRankListClass,
  profileRankRowClass,
  profileRankTextClass,
  profileSectionClass,
  profileSectionTitleClass,
  socialSegmentedButtonClass,
  socialSegmentedClass,
} from "@/components/social/socialClasses";

const PERIODS: ListeningRankPeriod[] = ["week", "all"];

export function ProfileListeningRank({ uid, isSelf }: ProfileListeningRankProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ListeningRankPeriod>("week");
  const query = useUserListeningRank(uid, period);
  const songs = query.data?.songs ?? [];
  // 听歌排行是否可见由对方的隐私设置决定：别人未公开时整块不显示，加载中也先不占位
  if (!isSelf && !query.isError && (query.isPending || query.data?.restricted)) return null;
  async function play(index: number) {
    try {
      const player = usePlayerStore.getState();
      player.setQueue(songs, index);
      await player.playQueueIndex(index);
    } catch {
      toast.error(t("social.actionFailed"));
    }
  }
  return (
    <section className={profileSectionClass}>
      <div className={profileSectionTitleClass}>
        <h2>{t("social.topTracks")}</h2>
        <div className={socialSegmentedClass} role="group" aria-label={t("social.topTracks")}>
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              className={socialSegmentedButtonClass}
              aria-pressed={period === item}
              onClick={() => setPeriod(item)}
            >
              {t(item === "week" ? "social.thisWeek" : "social.allTime")}
            </button>
          ))}
        </div>
      </div>
      <SocialState
        loading={query.isPending}
        error={query.isError && !query.data}
        empty={
          query.data?.restricted
            ? t("social.rankHidden")
            : query.data && !songs.length
              ? t("social.rankEmpty")
              : undefined
        }
        onRetry={() => void query.refetch()}
      >
        <ol className={profileRankListClass}>
          {songs.map((song, index) => (
            <li key={song.id}>
              <button
                type="button"
                className={cn(profileRankRowClass, "hover:bg-foreground/8")}
                onClick={() => void play(index)}
              >
                <span
                  className={cn(
                    "w-5 shrink-0 text-center text-[14px] text-muted-foreground tabular-nums",
                    // 前三名高亮
                    index < 3 && "font-bold text-primary",
                  )}
                >
                  {index + 1}
                </span>
                <span className={profileRankCoverClass}>
                  <img
                    src={getSizedImageUrl(song.al.picUrl, 96)}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </span>
                <span className={profileRankTextClass}>
                  <strong className="block truncate text-[14px] font-[650]">{song.name}</strong>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                    {song.ar.map((artist) => artist.name).join(" / ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </SocialState>
    </section>
  );
}
