"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUserListeningRank } from "@/hooks/profile/useUserListeningRank";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import { SocialState } from "@/components/social/SocialPrimitives";
import type { ProfileListeningRankProps } from "@/types/social/components";
import type { ListeningRankPeriod } from "@/types/user/profile";
import s from "@/components/social/Social.module.css";

const PERIODS: ListeningRankPeriod[] = ["week", "all"];

export function ProfileListeningRank({ uid }: ProfileListeningRankProps) {
  const { t } = useI18n();
  const [period, setPeriod] = useState<ListeningRankPeriod>("week");
  const query = useUserListeningRank(uid, period);
  const songs = query.data?.songs ?? [];
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
    <section className={s.profileSection}>
      <div className={s.sectionTitle}>
        <h2>{t("social.topTracks")}</h2>
        <div className={s.segmented} role="group" aria-label={t("social.topTracks")}>
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
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
        <ol className={s.rankList}>
          {songs.map((song, index) => (
            <li key={song.id}>
              <button type="button" className={s.rankRow} onClick={() => void play(index)}>
                <span className={s.rankNo}>{index + 1}</span>
                <span className={s.rankCover}>
                  <img
                    src={getSizedImageUrl(song.al.picUrl, 96)}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </span>
                <span className={s.rankText}>
                  <strong>{song.name}</strong>
                  <span>{song.ar.map((artist) => artist.name).join(" / ")}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </SocialState>
    </section>
  );
}
